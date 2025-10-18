from openai import OpenAI

def generar_recomendacion(texto_usuario: str) -> str:
    prompt = f"""
    Eres un nutricionista profesional. El usuario te describe su situación:
    "{texto_usuario}"
    Da una recomendación breve, clara y saludable, en español, considerando edad, peso, altura y nivel de actividad.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=[
                {"role": "system", "content": "Eres un experto en nutrición humana y salud."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Error al generar la recomendación:\n\n{str(e)}"
