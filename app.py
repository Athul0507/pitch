from flask import Flask
from flask import render_template
from flask import jsonify, request
try:
    import pandas as pd  # type: ignore
except Exception:  # fallback if pandas isn't available
    pd = None  # noqa

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/parts")
def get_parts():
    parts = [
        {
            "name": "Turbocharger",
            "desc": "High-performance turbo to boost engine power and efficiency.",
            "image": "https://images.unsplash.com/photo-1523661149972-0becaca20124?q=80&w=1200&auto=format&fit=crop"
        },
        {
            "name": "Carbon Fiber Wing",
            "desc": "Lightweight aerodynamic wing designed for downforce and stability.",
            "image": "https://images.unsplash.com/photo-1518551933037-24565a58f407?q=80&w=1200&auto=format&fit=crop"
        },
        {
            "name": "Ceramic Brakes",
            "desc": "Race-grade ceramic brakes delivering superior stopping power.",
            "image": "https://images.unsplash.com/photo-1589060625231-9467072b49a1?q=80&w=1200&auto=format&fit=crop"
        }
    ]
    return jsonify(parts)


@app.route("/api/parts_suggest")
def parts_suggest():
    q = request.args.get("q", default="", type=str).strip().lower()
    # Simple in-memory list for demo; in prod this would query a DB/search index
    catalog = [
        "Turbocharger",
        "Carbon Fiber Wing",
        "Ceramic Brakes",
        "High-Flow Intake",
        "Performance Exhaust",
        "Alcantara Steering Wheel",
        "Forged Pistons",
        "Sport Suspension",
        "Lightweight Rims",
        "Titanium Bolts",
        "Brake Pads",
        "Oil Filter",
        "Air Filter",
        "Fuel Pump",
        "Radiator",
        "Spark Plugs",
    ]
    items = []
    if len(q) >= 3:
        items = [name for name in catalog if q in name.lower()][:10]
    return jsonify({"items": items})


@app.route("/detail")
def detail():
    name = request.args.get("name", default="Unknown", type=str)
    return jsonify({"name": name})


@app.route("/detail_page")
def detail_page():
    name = request.args.get("name", default="Unknown", type=str)
    return render_template("detail.html", name=name)


@app.route("/search_result")
def search_result():
    name = request.args.get("name", default="", type=str)
    threshold = request.args.get("threshold", default="0.5", type=str)
    # Initialize dataframe with required columns
    rows = [
        {"slno": i + 1,
         "dtc": f"P0{100+i}",
         "desc": f"Sample diagnostic description {i+1}",
         "ecu": ["ECU-A", "ECU-B", "ECU-C"][i % 3],
         "similarity": round(0.95 - (i * 0.03) % 1.0, 2)}
        for i in range(20)
    ]

    if pd is not None:
        df = pd.DataFrame(rows, columns=["slno", "dtc", "desc", "ecu", "similarity"])  # noqa: F841
        data_rows = rows
    else:
        data_rows = rows

    return render_template("result.html", name=name, threshold=threshold, rows=data_rows)


if __name__ == "__main__":
    app.run(debug=True)