import base64
import hmac
import hashlib

# ⚙️ Choose a server‑side secret (keep this safe!)
SECRET = "mgT5lER7lw"

def generate_license_key(allowed_count: int, secret: str = SECRET) -> str:
    """
    Encode the allowed count into a license key:
      - payload = bytes of the integer
      - signature = HMAC‑SHA256(payload, secret)
      - token   = payload || b':' || signature
      - key     = 'WAZA-' + base64url(token)
    """
    # 1) Prepare payload
    data = str(allowed_count).encode("utf-8")
    
    # 2) Compute HMAC‑SHA256 signature
    sig = hmac.new(secret.encode(), data, hashlib.sha256).digest()
    
    # 3) Build token and base64‑url encode
    token = data + b":" + sig
    b64 = base64.urlsafe_b64encode(token).rstrip(b"=")
    
    return f"WAZA-{b64.decode('utf-8')}"

def decode_license_key(key: str, secret: str = SECRET) -> int:
    """
    Decode a WAZA‑license key, verify its signature, and return the allowed count.
    Raises ValueError if the key is invalid or tampered with.
    """
    if not key.startswith("WAZA-"):
        raise ValueError("Invalid prefix")
    
    # 1) Extract and pad the base64 part
    b64 = key[len("WAZA-"):].encode("utf-8")
    padding = b"=" * (-len(b64) % 4)
    token = base64.urlsafe_b64decode(b64 + padding)

    # 2) Split payload and signature
    try:
        data, sig = token.split(b":", 1)
    except ValueError:
        raise ValueError("Malformed token")

    # 3) Recompute expected signature
    expected = hmac.new(secret.encode(), data, hashlib.sha256).digest()
    if not hmac.compare_digest(sig, expected):
        raise ValueError("Signature mismatch — license invalid")

    # 4) Return the integer
    return int(data.decode("utf-8"))


if __name__ == "__main__":
    # Example usage
    allowed_count = 12
    license_key = generate_license_key(allowed_count)
    print(f"Generated License Key: {license_key}")

    try:
        decoded_count = decode_license_key(license_key)
        print(f"Decoded Allowed Count: {decoded_count}")
    except ValueError as e:
        print(f"Error decoding license key: {e}")
