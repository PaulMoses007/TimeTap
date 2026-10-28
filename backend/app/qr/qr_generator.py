import os

import qrcode


def generate_restaurant_qr(
    restaurant_id: int,
    restaurant_name: str
):
    """
    Generate a QR code for a restaurant.
    """

    # Data stored inside the QR code
    qr_data = f"restaurant_id={restaurant_id}"

    # Create QR object
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )

    qr.add_data(qr_data)
    qr.make(fit=True)

    # Generate image
    image = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    # Ensure folder exists
    os.makedirs("qrcodes", exist_ok=True)

    # Create filename
    filename = f"restaurant_{restaurant_id}.png"

    filepath = os.path.join(
        "qrcodes",
        filename
    )

    # Save image
    image.save(filepath)

    return filepath