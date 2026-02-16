from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List
import os


class Settings(BaseSettings):
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "hive_platform"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    
    # CORS - Store as string to avoid JSON parsing issues
    allowed_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    
    # App
    app_name: str = "The Hive Platform"
    debug: bool = True
    
    def get_allowed_origins(self) -> List[str]:
        """Get allowed origins as a list"""
        # Get from environment variable or use default
        origins_str = os.getenv("ALLOWED_ORIGINS", self.allowed_origins)
        origins_list = [origin.strip() for origin in origins_str.split(",")]
        
        # In debug mode, also allow common localhost variations
        if self.debug:
            # Add common localhost ports if not already present
            common_ports = [3000, 5173, 5174, 5175, 3001, 8080, 5000]
            for port in common_ports:
                localhost_http = f"http://localhost:{port}"
                localhost_127 = f"http://127.0.0.1:{port}"
                if localhost_http not in origins_list:
                    origins_list.append(localhost_http)
                if localhost_127 not in origins_list:
                    origins_list.append(localhost_127)
        
        return origins_list
    
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"  # Ignore extra environment variables not defined in the model
    )


settings = Settings()
