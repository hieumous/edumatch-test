from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_is_running():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "running"
    assert "service" in data
    assert "version" in data

