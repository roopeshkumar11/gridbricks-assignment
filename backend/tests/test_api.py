import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_summary():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["counts"]["actualsCount"] > 0
    assert data["counts"]["forecastsCount"] > 0

def test_comparison_endpoint():
    response = client.get("/api/comparison?decision_date=2026-01-05&cutoff_time=11:00:00Z&aggregation=hourly")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-06"
    assert len(data["records"]) == 24
    assert data["metrics"] is not None
    assert "maeMW" in data["metrics"]

def test_evolution_endpoint():
    response = client.get("/api/forecast/evolution?target_start_time=2026-01-06T12:00:00Z")
    assert response.status_code == 200
    data = response.json()
    assert data["targetStartTime"] == "2026-01-06T12:00:00Z"
    assert len(data["revisions"]) > 0

def test_procurement_endpoint():
    response = client.get("/api/procurement?decision_date=2026-01-05&confidence_level=0.90")
    assert response.status_code == 200
    data = response.json()
    assert len(data["periods"]) == 24
    assert data["totalRiskBufferMWh"] > 0

def test_metrics_report_endpoint():
    response = client.get("/api/metrics/report?month=2026-01")
    assert response.status_code == 200
    data = response.json()
    assert data["overall"]["sampleCount"] > 0
    assert len(data["distribution"]) > 0
    assert len(data["byHorizon"]) > 0
    assert len(data["dailyBreakdown"]) > 20

def test_export_csv():
    response = client.get("/api/export/csv?decision_date=2026-01-05")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "Start Time,Target Date" in response.text
