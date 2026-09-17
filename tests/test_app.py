from fastapi.testclient import TestClient

import src.app as app_module
from src.app import app

client = TestClient(app)


def test_get_activities_returns_activity_data():
    # Arrange
    expected_keys = {"Chess Club", "Programming Class", "Gym Class"}

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    body = response.json()
    assert expected_keys.issubset(body.keys())
    assert body["Chess Club"]["participants"]


def test_signup_adds_email_for_activity():
    # Arrange
    app_module.activities["Chess Club"]["participants"] = [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]

    # Act
    response = client.post(
        "/activities/Chess Club/signup?email=newstudent@mergington.edu"
    )

    # Assert
    assert response.status_code == 200
    assert "newstudent@mergington.edu" in app_module.activities["Chess Club"]["participants"]


def test_signup_rejects_duplicate_email():
    # Arrange
    app_module.activities["Chess Club"]["participants"] = [
        "michael@mergington.edu",
    ]

    # Act
    response = client.post(
        "/activities/Chess Club/signup?email=michael@mergington.edu"
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


def test_unregister_participant_removes_email():
    # Arrange
    app_module.activities["Chess Club"]["participants"] = [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]

    # Act
    response = client.delete(
        "/activities/Chess Club/participants/michael@mergington.edu"
    )

    # Assert
    assert response.status_code == 200
    assert "michael@mergington.edu" not in app_module.activities["Chess Club"]["participants"]
    assert "daniel@mergington.edu" in app_module.activities["Chess Club"]["participants"]


def test_root_redirects_to_static_index():
    # Act
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_signup_returns_404_for_unknown_activity():
    # Act
    response = client.post("/activities/Unknown Activity/signup?email=test@mergington.edu")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_returns_404_for_unknown_activity():
    # Act
    response = client.delete("/activities/Unknown Activity/participants/test@mergington.edu")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_returns_404_for_missing_participant():
    # Arrange
    app_module.activities["Chess Club"]["participants"] = [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]

    # Act
    response = client.delete("/activities/Chess Club/participants/not-here@mergington.edu")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"
