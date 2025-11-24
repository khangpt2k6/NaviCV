
import pytest
def test_basic():
    assert True


def test_arithmetic():
    assert 1 + 1 == 2
    assert 2 * 3 == 6


def test_string_operations():
    text = "NaviCV"
    assert text.lower() == "navicv"
    assert len(text) == 6
