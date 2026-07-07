from app.security.password import (
    hash_password,
    verify_password
)

password = "Welcome123"

hashed = hash_password(password)

print("Original :", password)
print("Hashed   :", hashed)

print(
    "Verified :",
    verify_password(password, hashed)
)