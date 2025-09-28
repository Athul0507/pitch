from flask import Flask
from flask import render_template
from flask import jsonify, request
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.models import ColumnDataSource, HoverTool


import random
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


def create_bar_chart(rows):
    """Create a bar chart for DTC similarity scores"""
    dtc_values = [row["dtc"] for row in rows]
    similarity_scores = [row["similarity"] for row in rows]
    ecu_values = [row["ecu"] for row in rows]

    bar_source = ColumnDataSource(data=dict(
        dtc=dtc_values, 
        similarity=similarity_scores,
        ecu=ecu_values
    ))

    bar_chart = figure(
        x_range=dtc_values,
        title="DTC Similarity Scores (Bar Chart)",
        height=350,
        sizing_mode="stretch_width",
        background_fill_color="#0b0c0f",
        border_fill_color="#0b0c0f",
    )

    bar_chart.vbar(
        x="dtc",
        top="similarity",
        width=0.6,
        source=bar_source,
        color="#4aa3ff",
        alpha=0.95,
        line_color=None,
        hover_color="#9fc7ff",
        muted_alpha=0.2,
    )

    bar_chart.xgrid.grid_line_color = None
    bar_chart.ygrid.grid_line_color = "#293040"
    bar_chart.yaxis.major_tick_line_color = "#9aa4ad"
    bar_chart.yaxis.minor_tick_line_color = "#9aa4ad"
    bar_chart.yaxis.axis_label_text_color = "#cdd6df"
    bar_chart.xaxis.major_label_text_color = "#e6e8eb"
    bar_chart.yaxis.major_label_text_color = "#e6e8eb"
    bar_chart.title.text_color = "#cdd6df"
    bar_chart.xaxis.major_label_orientation = "vertical"

    # Bar chart hover tool
    bar_hover = HoverTool()
    bar_hover.tooltips = [
        ("DTC", "@dtc"),
        ("Similarity", "@similarity"),
        ("ECU", "@ecu"),
    ]
    bar_chart.add_tools(bar_hover)

    # Common styling
    bar_chart.outline_line_color = None
    bar_chart.toolbar_location = None
    bar_chart.min_border_left = 40
    bar_chart.min_border_right = 15

    return bar_chart


def create_scatter_chart(rows):
    """Create a scatter chart for DTC similarity scores"""
    dtc_values = [row["dtc"] for row in rows]
    similarity_scores = [row["similarity"] for row in rows]
    slno_values = [row["slno"] for row in rows]
    ecu_values = [row["ecu"] for row in rows]

    # Color mapping for ECUs
    color_map = {"ECU-A": "#4aa3ff", "ECU-B": "#ff6b6b", "ECU-C": "#4ecdc4"}
    colors = [color_map[ecu] for ecu in ecu_values]

    scatter_source = ColumnDataSource(data=dict(
        dtc=dtc_values, 
        similarity=similarity_scores,
        slno=slno_values,
        ecu=ecu_values,
        colors=colors
    ))

    scatter_chart = figure(
        title="DTC Similarity Scores (Scatter Plot)",
        height=350,
        sizing_mode="stretch_width",
        background_fill_color="#0b0c0f",
        border_fill_color="#0b0c0f",
        x_axis_label="Serial Number",
        y_axis_label="Similarity Score"
    )

    scatter_chart.circle(
        x="slno",
        y="similarity",
        size=12,
        source=scatter_source,
        color="colors",
        alpha=0.8,
        hover_color="#ffffff",
        hover_alpha=0.9
    )

    scatter_chart.xgrid.grid_line_color = "#293040"
    scatter_chart.ygrid.grid_line_color = "#293040"
    scatter_chart.xaxis.major_tick_line_color = "#9aa4ad"
    scatter_chart.yaxis.major_tick_line_color = "#9aa4ad"
    scatter_chart.xaxis.minor_tick_line_color = "#9aa4ad"
    scatter_chart.yaxis.minor_tick_line_color = "#9aa4ad"
    scatter_chart.xaxis.axis_label_text_color = "#cdd6df"
    scatter_chart.yaxis.axis_label_text_color = "#cdd6df"
    scatter_chart.xaxis.major_label_text_color = "#e6e8eb"
    scatter_chart.yaxis.major_label_text_color = "#e6e8eb"
    scatter_chart.title.text_color = "#cdd6df"

    # Scatter chart hover tool
    scatter_hover = HoverTool()
    scatter_hover.tooltips = [
        ("Serial No", "@slno"),
        ("DTC", "@dtc"),
        ("Similarity", "@similarity"),
        ("ECU", "@ecu"),
    ]
    scatter_chart.add_tools(scatter_hover)

    # Common styling
    scatter_chart.outline_line_color = None
    scatter_chart.toolbar_location = None
    scatter_chart.min_border_left = 40
    scatter_chart.min_border_right = 15

    return scatter_chart


@app.route("/search_result")
def search_result():
    name = request.args.get("name", default="", type=str)
    threshold = request.args.get("threshold", default="0.5", type=str)
    
    # Initialize dataframe with required columns
    rows = [
        {"slno": i + 1,
         "dtc": f"P0{100+i}",
         "desc": f"Sample long diagnostic description {i+1} which will hopefully take up more than 1 line per row.",
         "ecu": ["ECU-A", "ECU-B", "ECU-C"][i % 3],
         "similarity": round(0.95 - (i * 0.03) % 1.0, 2)}
        for i in range(20)
    ]

    if pd is not None:
        df = pd.DataFrame(rows, columns=["slno", "dtc", "desc", "ecu", "similarity"])  # noqa: F841
        data_rows = rows
    else:
        data_rows = rows

    # Create charts using separate functions
    bar_chart = create_bar_chart(rows)
    scatter_chart = create_scatter_chart(rows)

    # Generate components for both charts
    bar_script, bar_div = components(bar_chart)
    scatter_script, scatter_div = components(scatter_chart)

    return render_template(
        "result.html", 
        name=name, 
        threshold=threshold, 
        rows=data_rows, 
        bar_script=bar_script, 
        bar_div=bar_div,
        scatter_script=scatter_script,
        scatter_div=scatter_div
    )


if __name__ == "__main__":
    app.run(debug=True)