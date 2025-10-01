import config
from dotenv import dotenv_values
from app import bp as main_bp
from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    app.config.update(
        DEBUG=config.DEBUG,
        SECRET_KEY=config.SECRET_KEY
    )

    # Register blueprints here
    app.register_blueprint(main_bp, url_prefix=config.BP_PREFIX)

    CORS(app, supports_credentials=True)

    return app


if __name__ == "__main__":
    app = create_app()
    dot = dotenv_values("../.env")
    app.run(port=int(dot.get("BACKEND_PORT", 8000)))
