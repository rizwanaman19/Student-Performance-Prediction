from flask import Flask, request, jsonify, render_template
import pickle
import pandas as pd

app = Flask(__name__)

MODEL = 'Model.pkl'
try:
    with open(MODEL, 'rb') as file:
        pipeline = pickle.load(file)
        model = pipeline['model']
        scaler = pipeline['scaler']
        encoder = pipeline['encoder']
    print("Model pipeline loaded successfully.")
except FileNotFoundError:
    print(f"Warning: '{MODEL}' not found. Please ensure your trained model is in the root directory.")
    model, scaler, encoder = None, None, None


@app.route('/')
def home():
    return render_template('form.html')


@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'status': 'error', 'message': 'Machine learning model is not loaded.'}), 500

    try:
        data = request.get_json()
        df = pd.DataFrame([data])

    
        gender = df['Gender'].iloc[0]
        df['Gender_Male'] = 1 if gender == 'Male' else 0

    
        major = df['Major'].iloc[0]
        for m in ['Computer Science', 'Economics', 'Engineering', 'Mathematics', 'Psychology']:
            df[f'Major_{m}'] = 1 if major == m else 0


        expected_cols = [
            'Age', 'Mid_Term', 'Attendance', 'Study_Hours_Per_Day',
            'Previous_GPA', 'Sleep_Hours', 'Social_Hours_Per_Week',
            'Quiz', 'Assignment',
            'Gender_Male',
            'Major_Computer Science', 'Major_Economics',
            'Major_Engineering', 'Major_Mathematics', 'Major_Psychology'
        ]

        for col in expected_cols:
            if col not in df.columns:
                df[col] = 0

        df = df[expected_cols]

        scaled_features = scaler.transform(df)
        prediction_encoded = model.predict(scaled_features)
        prediction_label = encoder.inverse_transform(prediction_encoded)

    
        return jsonify({
            'status': 'success',
            'prediction': prediction_label[0]
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"An error occurred during prediction: {str(e)}"
        }), 400


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
