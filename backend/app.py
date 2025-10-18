from flask import Flask, request, jsonify
from flask_cors import CORS
from ia_model import generar_recomendacion

app = Flask(__name__)
CORS(app)  

@app.route("/recomendar", methods=["POST"])
def recomendar():
    data = request.get_json()
    texto_usuario = data.get("texto", "")
    recomendacion = generar_recomendacion(texto_usuario)
    return jsonify({"recomendacion": recomendacion})

if __name__ == "__main__":
    app.run(debug=True)
