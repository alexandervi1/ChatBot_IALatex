"""
TOON (Token-Oriented Object Notation) Encoder
A lightweight, token-efficient data serialization format optimized for LLM prompts.
Achieves 30-60% token reduction compared to JSON.
"""

from typing import Any, Dict, List, Union
import re


class TOONEncoder:
    """Encodes Python data structures into TOON format."""
    
    @staticmethod
    def encode(data: Union[Dict, List, Any]) -> str:
        """
        Convert Python data to TOON format.
        
        TOON Format Rules:
        - Minimal punctuation (no braces, minimal quotes)
        - Indentation-based structure
        - Optimized for arrays of objects (tabular format)
        - Human-readable and compact
        
        Args:
            data: Python dict, list, or primitive to encode
            
        Returns:
            TOON-formatted string
        """
        if isinstance(data, dict):
            return TOONEncoder._encode_dict(data)
        elif isinstance(data, list):
            return TOONEncoder._encode_list(data)
        else:
            return TOONEncoder._encode_value(data)
    
        return "\n".join(lines)
    
    @staticmethod
    def _encode_dict(d: Dict, indent: int = 0) -> str:
        """Encode a dictionary in TOON format."""
        lines = []
        prefix = " " * indent # Minified indentation
        
        for key, value in d.items():
            # Clean key (remove special chars if needed)
            clean_key = str(key).replace(" ", "_")
            
            if isinstance(value, dict):
                # Nested object
                lines.append(f"{prefix}{clean_key}:")
                lines.append(TOONEncoder._encode_dict(value, indent + 1))
            elif isinstance(value, list):
                # Array
                if value and isinstance(value[0], dict):
                    # Array of objects - use tabular format
                    lines.append(f"{prefix}{clean_key}:")
                    lines.append(TOONEncoder._encode_table(value, indent + 1))
                else:
                    # Simple array
                    lines.append(f"{prefix}{clean_key}:{TOONEncoder._encode_simple_list(value)}")
            else:
                # Simple value
                lines.append(f"{prefix}{clean_key}:{TOONEncoder._encode_value(value)}")
        
        return "\n".join(lines)
    
    @staticmethod
    def _encode_list(lst: List, indent: int = 0) -> str:
        """Encode a list in TOON format."""
        if not lst:
            return "[]"
        
        # Check if list of dicts (use table format)
        if isinstance(lst[0], dict):
            return TOONEncoder._encode_table(lst, indent)
        else:
            return TOONEncoder._encode_simple_list(lst)
    
    @staticmethod
    def _encode_table(objects: List[Dict], indent: int = 0) -> str:
        """
        Encode array of objects as a compact table.
        This is where TOON shines - tabular data is very token-efficient.
        
        Example:
        | role    | content           |
        | user    | Hello             |
        | ai      | Hi there          |
        """
        if not objects:
            return ""
        
        prefix = "  " * indent
        
        # Get all unique keys
        all_keys = set()
        for obj in objects:
            all_keys.update(obj.keys())
        keys = sorted(all_keys)
        
        # Build table
        lines = []
        
        # Header
        header = "|".join(keys)
        lines.append(f"{prefix}|{header}|")
        
        # Rows
        for obj in objects:
            row_values = []
            for key in keys:
                value = obj.get(key, "")
                str_value = str(value)
                
                # Smart truncation:
                # - 'content' or 'context': allow more chars (e.g. 500)
                # - others: keep short (e.g. 50)
                limit = 500 if key in ["content", "context", "text"] else 50
                
                if len(str_value) > limit:
                    str_value = str_value[:limit-3] + "..."
                
                # Escape pipes in table values
                str_value = str_value.replace("|", "\\|").replace("\n", " ")
                row_values.append(str_value)
            
            row = "|".join(row_values)
            lines.append(f"{prefix}|{row}|")
        
        return "\n".join(lines)
    
    @staticmethod
    def _encode_simple_list(lst: List) -> str:
        """Encode a simple list (non-dict items)."""
        # Use compact comma-separated format
        values = [TOONEncoder._encode_value(item) for item in lst]
        return "[" + ", ".join(values) + "]"
    
    @staticmethod
    def _encode_value(value: Any) -> str:
        """Encode a primitive value."""
        if value is None:
            return "null"
        elif isinstance(value, bool):
            return "true" if value else "false"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, str):
            # Block string check: if long and has newlines, use block format
            if "\n" in value and len(value) > 50:
                # Block string format: '''...'''
                # We need to escape ''' inside the string if present
                escaped = value.replace("'''", "\\'''")
                return f"'''{escaped}'''"
            
            # Normal string
            # Only quote if contains special characters or spaces
            if " " in value or ":" in value or "|" in value or "\n" in value or "[" in value or "]" in value or "{" in value or "}" in value or "'" in value or '"' in value:
                # Escape quotes and use double quotes
                escaped = value.replace('"', '\\"').replace("\n", "\\n")
                return f'"{escaped}"'
            return value
        else:
            return str(value)


# Convenience function
def to_toon(data: Union[Dict, List, Any]) -> str:
    """Convert Python data to TOON format."""
    return TOONEncoder.encode(data)


# Example usage and tests
if __name__ == "__main__":
    # Test 1: Simple dict
    data1 = {
        "query": "What is the main topic?",
        "context": "This is a document about AI.",
        "temperature": 0.7
    }
    print("=== Test 1: Simple Dict ===")
    print(to_toon(data1))
    print()
    
    # Test 2: Chat history (array of objects - tabular format)
    data2 = {
        "query": "Explain this",
        "chat_history": [
            {"role": "user", "content": "Hello"},
            {"role": "ai", "content": "Hi there! How can I help?"},
            {"role": "user", "content": "Tell me about Python"}
        ]
    }
    print("=== Test 2: Chat History (Table) ===")
    print(to_toon(data2))
    print()
    
    # Test 3: Nested structure
    data3 = {
        "request": {
            "query": "What is AI?",
            "options": {
                "temperature": 0.5,
                "max_tokens": 100
            }
        },
        "metadata": {
            "user_id": 123,
            "timestamp": "2024-01-01"
        }
    }
    print("=== Test 3: Nested Structure ===")
    print(to_toon(data3))
