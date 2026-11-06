from main import get_cors_origins


def test_cors_origins_defaults_when_unset():
    origins = get_cors_origins(None)
    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins
    assert len(origins) == 2


def test_cors_origins_defaults_when_empty_string():
    origins = get_cors_origins("   ")
    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins


def test_cors_origins_parsing_custom_list():
    raw_env = "https://my-app.vercel.app/, https://preview.vercel.app/ , https://custom-domain.com"
    origins = get_cors_origins(raw_env)
    assert origins == [
        "https://my-app.vercel.app",
        "https://preview.vercel.app",
        "https://custom-domain.com",
    ]

