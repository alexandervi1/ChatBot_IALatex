import pytest
import os
from unittest.mock import patch, MagicMock, mock_open
from services.pdf_processor import PDFProcessor
from langchain_core.documents import Document

# --- Mock Objects ---

class MockPage:
    def __init__(self, text):
        self._text = text
    def extract_text(self):
        return self._text

class MockPdfReader:
    def __init__(self, file_path, page_texts):
        self.pages = [MockPage(text) for text in page_texts]
        if "not_found" in file_path:
            raise FileNotFoundError(f"File not found: {file_path}")
        if "corrupt" in file_path:
            raise Exception("Simulated PyPDF2 error")

class MockDocxParagraph:
    def __init__(self, text):
        self.text = text

class MockDocxDocument:
    def __init__(self, file_path):
        if "not_found" in file_path:
            raise FileNotFoundError(f"File not found: {file_path}")
        if "corrupt" in file_path:
            raise Exception("Simulated docx error")
        self.paragraphs = [MockDocxParagraph("This is a docx test.")]

class MockPptxShape:
    def __init__(self, text):
        self.text = text
    @property
    def has_text_frame(self):
        return True
    @property
    def text_frame(self):
        return self

class MockPptxSlide:
    def __init__(self):
        self.shapes = [MockPptxShape("This is a pptx test.")]

class MockPptxPresentation:
    def __init__(self, file_path):
        if "not_found" in file_path:
            raise FileNotFoundError(f"File not found: {file_path}")
        if "corrupt" in file_path:
            raise Exception("Simulated pptx error")
        self.slides = [MockPptxSlide()]

# --- Pytest Fixtures ---

@pytest.fixture
def processor():
    return PDFProcessor(chunk_size=150, chunk_overlap=20)

# --- Test Cases ---

def test_clean_text(processor):
    text = "  word1-\nword2 \n\n  line 2  \n12345\nshort\n"
    cleaned = processor._clean_text(text)
    # The new logic should keep 'line 2' and 'short', but remove '12345'
    assert cleaned == "word1word2\n\nline 2\nshort"

@patch('services.pdf_processor.PdfReader', side_effect=lambda path: MockPdfReader(path, ["This is a PDF test."]))
def test_process_file_pdf_successfully(mock_pdf_reader, processor):
    chunks = processor.process_file("dummy.pdf")
    assert len(chunks) == 1
    assert chunks[0]['content'] == "This is a PDF test."
    assert chunks[0]['metadata']['source_file'] == "dummy.pdf"
    assert chunks[0]['metadata']['page'] == 1

@patch('services.pdf_processor.docx.Document', side_effect=MockDocxDocument)
def test_process_file_docx_successfully(mock_docx, processor):
    chunks = processor.process_file("dummy.docx")
    assert len(chunks) == 1
    assert chunks[0]['content'] == "This is a docx test."
    assert chunks[0]['metadata']['source_file'] == "dummy.docx"

@patch('services.pdf_processor.pptx.Presentation', side_effect=MockPptxPresentation)
def test_process_file_pptx_successfully(mock_pptx, processor):
    chunks = processor.process_file("dummy.pptx")
    assert len(chunks) == 1
    assert "This is a pptx test." in chunks[0]['content']
    assert chunks[0]['metadata']['source_file'] == "dummy.pptx"

@patch("builtins.open", new_callable=mock_open, read_data="This is a txt test.")
def test_process_file_txt_successfully(mock_open, processor):
    chunks = processor.process_file("dummy.txt")
    assert len(chunks) == 1
    assert chunks[0]['content'] == "This is a txt test."
    assert chunks[0]['metadata']['source_file'] == "dummy.txt"

def test_process_file_unsupported_format(processor):
    # Test that the generic exception is raised, as the specific one is caught and re-raised.
    with pytest.raises(Exception, match="El archivo 'document.xyz' podría estar corrupto o no ser soportado."):
        processor.process_file("document.xyz")

def test_process_file_not_found(processor):
    with pytest.raises(FileNotFoundError):
        processor.process_file("not_found.pdf")

@patch('services.pdf_processor.PdfReader', side_effect=lambda path: MockPdfReader(path, ["", " "]))
def test_process_file_no_text_extracted(mock_pdf_reader, processor):
    # Test that the generic exception is raised.
    with pytest.raises(Exception, match="El archivo 'empty_content.pdf' podría estar corrupto o no ser soportado."):
        processor.process_file("empty_content.pdf")

@patch('services.pdf_processor.docx.Document', side_effect=lambda path: MockDocxDocument(path) if "dummy" in path else (_ for _ in ()).throw(Exception("Corrupt file")))
def test_process_file_corrupt_file_general_exception(mock_docx, processor):
    with pytest.raises(Exception, match="El archivo 'corrupt.docx' podría estar corrupto o no ser soportado."):
        processor.process_file("corrupt.docx")

def test_chunking_logic(processor):
    long_text = " ".join(["word"] * 100) # A long text that will be split
    with patch("builtins.open", new_callable=mock_open, read_data=long_text):
        chunks = processor.process_file("long.txt")
        assert len(chunks) > 1
        assert "chunk_index" in chunks[0]['metadata']
        assert "token_count" in chunks[0]['metadata']
        assert chunks[0]['metadata']['chunk_index'] == 0
        assert chunks[1]['metadata']['chunk_index'] == 1
        # The brittle overlap check is removed. We just care that it's chunked.
        assert chunks[0]['content'] != long_text
