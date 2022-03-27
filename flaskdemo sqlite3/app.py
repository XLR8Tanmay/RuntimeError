from flask import url_for,Flask,render_template,request
import sqlite3
import os
import pickle
currrentdir=os.path.dirname(os.path.abspath(__file__))
clf=pickle.load(open('nlp_m21.pkl','rb'))
cv=pickle.load(open('trans.pkl','rb'))




app=Flask(__name__)

@app.route("/")
def main():
    return render_template("home.html")


@app.route("/", methods=["POST"])
def phnbook():
    name=request.form["name"]
    #number=request.form["number"]
    marks=request.form["marks"]
    
    data=[name]
    vect=cv.transform(data).toarray()
    rating=clf.predict(vect)
    connection=sqlite3.connect(currrentdir + "\demodb.db")
    cursor=connection.cursor()
    query="INSERT INTO demodb VALUES('{n}','{m}','{l}')".format(n=name,m=rating[0],l=marks)
    cursor.execute(query)
    connection.commit()
    return render_template("home.html",pre="FEEDBACK SUBMITTED")











if __name__ =="__main__":
    app.run(debug=True)