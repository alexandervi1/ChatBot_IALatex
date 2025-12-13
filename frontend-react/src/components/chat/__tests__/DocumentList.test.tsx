
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentList } from '../document-list';

const documents = [
  { id: 1, source_file: 'doc1.pdf', total_chunks: 10 },
  { id: 2, source_file: 'doc2.pdf', total_chunks: 20 },
];

describe('DocumentList', () => {
  it('renders the list of documents', () => {
    render(
      <DocumentList
        documents={documents}
        uploadStatus=""
        deletingId={null}
        handleUploadClick={() => {}}
        handleDocSelectionChange={() => {}}
        handleDelete={() => {}}
      />
    );
    expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
  });

  it('calls the delete handler when the delete button is clicked', () => {
    const handleDelete = jest.fn();
    render(
      <DocumentList
        documents={documents}
        uploadStatus=""
        deletingId={null}
        handleUploadClick={() => {}}
        handleDocSelectionChange={() => {}}
        handleDelete={handleDelete}
      />
    );
    fireEvent.click(screen.getByTestId('delete-button-1'));
    expect(handleDelete).toHaveBeenCalledWith(1, 'doc1.pdf');
  });
});
