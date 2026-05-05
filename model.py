import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import pickle

try:
    dataset = pd.read_excel("student_final_cgpa_dataset.xlsx")
except FileNotFoundError:
    print("File not Found")

dataset = dataset.drop(["Student_ID"] , axis=1)

X = dataset.drop(["Final_CGPA","Risk_Level"],axis=1)
y = dataset["Risk_Level"]


le = LabelEncoder()
y = le.fit_transform(y)
sc = StandardScaler()

X_train, X_test , y_train , y_test = train_test_split(
        X,y,
        test_size=0.2,
        random_state=42
        )

X_train =  sc.fit_transform(X_train)
X_test = sc.transform(X_test)

model = LogisticRegression()
model.fit(X_train,y_train)
l_pred = model.predict(X_test)

with open("Model.pkl","wb") as file:
    pickle.dump({'model': model, 
                 'scaler': sc , 
                 'encoder': le}
                 , file)