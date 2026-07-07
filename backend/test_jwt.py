from app.security.jwt import create_access_token

token = create_access_token(
    {
        "sub": "paul@example.com"
    }
)

print(token)