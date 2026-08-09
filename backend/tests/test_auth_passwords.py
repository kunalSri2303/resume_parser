import pytest
import bcrypt
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal
from app.database.operations import get_user_by_username, update_user_password, create_user

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_test_users():
    """Ensures test database user credentials start from known test baseline."""
    db = SessionLocal()
    admin_hash = bcrypt.hashpw(b"AdminPassword2026!", bcrypt.gensalt()).decode("utf-8")
    hm_hash = bcrypt.hashpw(b"ManagerPassword2026!", bcrypt.gensalt()).decode("utf-8")
    
    admin_user = get_user_by_username(db, "admin")
    if admin_user:
        update_user_password(db, "admin", admin_hash)
    else:
        create_user(db, "admin", admin_hash, "admin")
        
    hm_user = get_user_by_username(db, "hiringmanager")
    if hm_user:
        update_user_password(db, "hiringmanager", hm_hash)
    else:
        create_user(db, "hiringmanager", hm_hash, "hiring_manager")
    db.close()

def test_auth_login_success():
    """Test successful login with default admin credentials."""
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "AdminPassword2026!",
        "role": "admin"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"
    assert "password_hash" not in data["user"]

def test_auth_login_invalid_password():
    """Test login with wrong password fails with 401."""
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "WrongPassword123!",
        "role": "admin"
    })
    assert response.status_code == 401

def test_auth_change_password_self():
    """Test user changing their own password with correct current password."""
    # 1. Change admin password
    res = client.post("/api/auth/change-password", json={
        "current_password": "AdminPassword2026!",
        "new_password": "NewAdminSecurePassword2026!",
        "target_username": "admin",
        "requester_role": "admin"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # 2. Login with old password should fail
    old_login = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "AdminPassword2026!",
        "role": "admin"
    })
    assert old_login.status_code == 401

    # 3. Login with new password should succeed
    new_login = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "NewAdminSecurePassword2026!",
        "role": "admin"
    })
    assert new_login.status_code == 200

    # 4. Restore original password for clean state
    restore = client.post("/api/auth/change-password", json={
        "current_password": "NewAdminSecurePassword2026!",
        "new_password": "AdminPassword2026!",
        "target_username": "admin",
        "requester_role": "admin"
    })
    assert restore.status_code == 200

def test_auth_change_password_short_length():
    """Test password change fails if new password is under 8 characters."""
    res = client.post("/api/auth/change-password", json={
        "current_password": "AdminPassword2026!",
        "new_password": "short",
        "target_username": "admin",
        "requester_role": "admin"
    })
    assert res.status_code == 400

def test_admin_reset_hiring_manager_password():
    """Test Admin can reset Hiring Manager password."""
    res = client.post("/api/auth/change-password", json={
        "new_password": "NewManagerPassword2026!",
        "target_username": "hiringmanager",
        "requester_role": "admin"
    })
    assert res.status_code == 200

    # Restore hiring manager password
    restore = client.post("/api/auth/change-password", json={
        "new_password": "ManagerPassword2026!",
        "target_username": "hiringmanager",
        "requester_role": "admin"
    })
    assert restore.status_code == 200

def test_list_users_no_hashes():
    """Test /api/auth/users endpoint never returns password_hash."""
    res = client.get("/api/auth/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 2
    for u in users:
        assert "password_hash" not in u
        assert "username" in u
        assert "role" in u
