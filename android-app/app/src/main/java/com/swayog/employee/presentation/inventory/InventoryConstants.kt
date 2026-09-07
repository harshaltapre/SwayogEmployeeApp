package com.swayog.employee.presentation.inventory

object InventoryConstants {
    val DCR_PANEL_COMPANIES = listOf(
        "Waaree Energies",
        "Adani Solar",
        "Vikram Solar",
        "Tata Power Solar",
        "Goldi Solar",
        "Premier Energies",
        "Loom Solar",
        "Rayzon Solar",
        "Saatvik Solar",
        "Servotech",
        "Other"
    )

    val INVERTER_COMPANIES = listOf(
        "Growatt",
        "Waaree",
        "Deye",
        "Solis",
        "Sungrow",
        "GoodWe",
        "Polycab",
        "Havells",
        "Luminous",
        "Microtek",
        "SolarEdge",
        "Enphase",
        "Fronius",
        "Other"
    )

    data class StockUnitOption(val value: String, val label: String)

    val STOCK_UNITS = listOf(
        StockUnitOption("unit", "Units / Nos (pcs)"),
        StockUnitOption("m", "Meters (m)"),
        StockUnitOption("mm", "Millimeters (mm)"),
        StockUnitOption("inch", "Inches (in)"),
        StockUnitOption("ft", "Feet (ft)"),
        StockUnitOption("bag", "Bags (bag)"),
        StockUnitOption("pkt", "Packets (pkt)"),
        StockUnitOption("roll", "Rolls (roll)"),
        StockUnitOption("pair", "Pairs (pair)"),
        StockUnitOption("kg", "Kilograms (kg)"),
        StockUnitOption("ltr", "Litres (L)"),
        StockUnitOption("sqft", "Sq. Ft (sqft)"),
        StockUnitOption("box", "Boxes (box)")
    )

    val CATEGORIES = listOf(
        "all" to "All Categories",
        "solar_panels" to "Solar Panels",
        "inverters" to "Inverters",
        "mounting" to "Mounting Structures",
        "batteries" to "Batteries",
        "electricals" to "Cables and BOS",
        "Earthing" to "Earthing",
        "Protection" to "Protection",
        "Cables" to "Cables",
        "Structure" to "Structure",
        "Hardware" to "Hardware",
        "Chemicals" to "Chemicals",
        "Electrical" to "Electrical",
        "Electronics" to "Electronics",
        "Tools" to "Tools"
    )

    val PREDEFINED_ITEMS = listOf(
        "Earthing Rod with Nut Bolts 3m",
        "Earthing Down Conductor 16 sq mm Green",
        "Earthing Pit Cover FRP",
        "Earthing Backfill Compound 25 Kg Bag",
        "Lightning Arrestor",
        "AC Cable 1C x 4 sq mm Cu Flexible",
        "DC Cable 4 sq mm (Red & Black)",
        "Structure Pipe 2x2",
        "Structure Pipe 1.5x1.5",
        "Structure Pipe 1x1",
        "Base Plate",
        "Anchor Bolts",
        "Monorail",
        "Mid Clamp",
        "End Clamp",
        "Rivet",
        "Silicon Bottle",
        "Conduit Pipe 25 mm",
        "Mounting Clamps 25 mm PVC",
        "25 mm Elbow",
        "25 mm T",
        "Electrical Insulation Tape",
        "Cable Tie Packet",
        "Flexible Conduit – 1 inch",
        "J Bolt SS with Single Washer and Nut",
        "MC4 Connector Pair",
        "Inverter",
        "DCR Panel",
        "N-DCR Panel",
        "ACDB",
        "DCDB",
        "Waterproofing Liquid (small bottle)",
        "Dewalt Bottle",
        "PVC Duct"
    )

    val PREDEFINED_ITEM_CATEGORIES: Map<String, String> = mapOf(
        "Earthing Rod with Nut Bolts 3m" to "Earthing",
        "Earthing Down Conductor 16 sq mm Green" to "Earthing",
        "Earthing Pit Cover FRP" to "Earthing",
        "Earthing Backfill Compound 25 Kg Bag" to "Earthing",
        "Lightning Arrestor" to "Protection",
        "AC Cable 1C x 4 sq mm Cu Flexible" to "Cables",
        "DC Cable 4 sq mm (Red & Black)" to "Cables",
        "Structure Pipe 2x2" to "Structure",
        "Structure Pipe 1.5x1.5" to "Structure",
        "Structure Pipe 1x1" to "Structure",
        "Base Plate" to "Structure",
        "Anchor Bolts" to "Hardware",
        "Monorail" to "Structure",
        "Mid Clamp" to "Hardware",
        "End Clamp" to "Hardware",
        "Rivet" to "Hardware",
        "Silicon Bottle" to "Chemicals",
        "Conduit Pipe 25 mm" to "Electrical",
        "Mounting Clamps 25 mm PVC" to "Hardware",
        "25 mm Elbow" to "Electrical",
        "25 mm T" to "Electrical",
        "Electrical Insulation Tape" to "Electrical",
        "Cable Tie Packet" to "Electrical",
        "Flexible Conduit – 1 inch" to "Electrical",
        "J Bolt SS with Single Washer and Nut" to "Hardware",
        "MC4 Connector Pair" to "Electronics",
        "Inverter" to "inverters",
        "DCR Panel" to "solar_panels",
        "N-DCR Panel" to "solar_panels",
        "ACDB" to "Protection",
        "DCDB" to "Protection",
        "Waterproofing Liquid (small bottle)" to "Chemicals",
        "Dewalt Bottle" to "Chemicals",
        "PVC Duct" to "Electrical"
    )
}
