import pytest

from server import listen_port


@pytest.mark.parametrize("platform, generic, expected", [("9191", "8001", 9191), (None, "8001", 8001), (None, None, 8000)])
def test_port_precedence(monkeypatch, platform, generic, expected):
    for name, value in [("X_ZOHO_CATALYST_LISTEN_PORT", platform), ("PORT", generic)]:
        if value is None:
            monkeypatch.delenv(name, raising=False)
        else:
            monkeypatch.setenv(name, value)
    assert listen_port() == expected


@pytest.mark.parametrize("port", ["not-a-port", "0", "65536", "-1", "80.5"])
def test_invalid_platform_port_fails(monkeypatch, port):
    monkeypatch.setenv("X_ZOHO_CATALYST_LISTEN_PORT", port)
    with pytest.raises(RuntimeError, match="Listening port"):
        listen_port()
