import pytest
from fastapi import status

from app.core.config import settings


UPLOAD_ENDPOINTS = ("/upload/profile-picture", "/upload/service-image")


def _saved_path_from_url(tmp_path, url: str):
    parts = [p for p in url.split("/") if p]
    # expected: ['uploads', subdir, filename]
    assert len(parts) >= 3
    assert parts[0] == "uploads"
    subdir = parts[-2]
    filename = parts[-1]
    return tmp_path / subdir / filename


class TestUploadAPI:
    @pytest.mark.parametrize(
        ("content_type", "filename", "payload", "expected_ext"),
        [
            ("image/jpeg", "photo.jpg", b"\xff\xd8\xffjpeg", ".jpg"),
            ("image/gif", "anim.gif", b"GIF89a123", ".gif"),
            ("image/webp", "img.webp", b"RIFFxxxxWEBP", ".webp"),
        ],
        ids=["jpeg_valid", "gif_valid", "webp_valid"],
    )
    def test_upload_accepts_supported_formats_separately(
        self,
        test_client,
        auth_headers,
        tmp_path,
        monkeypatch,
        content_type,
        filename,
        payload,
        expected_ext,
    ):
        monkeypatch.setattr(settings, "upload_dir", str(tmp_path))

        response = test_client.post(
            "/upload/service-image",
            headers=auth_headers,
            files={"file": (filename, payload, content_type)},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["url"].startswith("/uploads/services/")
        assert data["url"].endswith(expected_ext)

        saved_path = _saved_path_from_url(tmp_path, data["url"])
        assert saved_path.exists()
        assert saved_path.stat().st_size == len(payload)

    @pytest.mark.parametrize("endpoint", UPLOAD_ENDPOINTS)
    def test_upload_rejects_empty_file(self, test_client, auth_headers, tmp_path, monkeypatch, endpoint):
        monkeypatch.setattr(settings, "upload_dir", str(tmp_path))

        response = test_client.post(
            endpoint,
            headers=auth_headers,
            files={"file": ("empty.png", b"", "image/png")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Empty file is not allowed" in response.json()["detail"]

    @pytest.mark.parametrize("endpoint", UPLOAD_ENDPOINTS)
    def test_upload_rejects_invalid_content_type_parity(
        self, test_client, auth_headers, tmp_path, monkeypatch, endpoint
    ):
        monkeypatch.setattr(settings, "upload_dir", str(tmp_path))

        response = test_client.post(
            endpoint,
            headers=auth_headers,
            files={"file": ("not-image.txt", b"hello", "text/plain")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid file type" in response.json()["detail"]

    @pytest.mark.parametrize("endpoint", UPLOAD_ENDPOINTS)
    def test_upload_rejects_too_large_file_parity(
        self, test_client, auth_headers, tmp_path, monkeypatch, endpoint
    ):
        monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
        monkeypatch.setattr(settings, "max_upload_size_mb", 0.0001)
        large_payload = b"a" * 300  # ~0.000286 MB

        response = test_client.post(
            endpoint,
            headers=auth_headers,
            files={"file": ("large.webp", large_payload, "image/webp")},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "File too large" in response.json()["detail"]

    @pytest.mark.parametrize("endpoint", UPLOAD_ENDPOINTS)
    def test_upload_requires_authentication_parity(self, test_client, endpoint):
        response = test_client.post(
            endpoint,
            files={"file": ("avatar.png", b"abc", "image/png")},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filename_is_sanitized_and_not_derived_from_input_name(
        self, test_client, auth_headers, tmp_path, monkeypatch
    ):
        monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
        original_name = "../../../../evil name.png"

        response = test_client.post(
            "/upload/service-image",
            headers=auth_headers,
            files={"file": (original_name, b"safe", "image/png")},
        )

        assert response.status_code == status.HTTP_200_OK
        url = response.json()["url"]
        filename = url.split("/")[-1]
        assert filename != original_name
        assert filename.endswith(".png")
        assert ".." not in url
        assert "/" not in filename
        assert "//" not in url

