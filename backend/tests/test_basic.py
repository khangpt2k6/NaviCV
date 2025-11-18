"""Basic tests for the FastAPI backend."""

import pytest


def test_basic():
    """Basic sanity test."""
    assert True


def test_arithmetic():
    """Test basic arithmetic."""
    assert 1 + 1 == 2
    assert 2 * 3 == 6


def test_string_operations():
    """Test string operations."""
    text = "NaviCV"
    assert text.lower() == "navicv"
    assert len(text) == 6
