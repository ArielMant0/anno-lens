summary_schema = {
    "type": "object",
    "description": "Summary of a set of data points",
    "properties": {
        "summary": {
            "type": "string",
            "description": "The summary of the data characteristics"
        },
        "data_ids": {
            "type": "list",
            "description": "List of data point ids named in the summary"
        },
        "columns": {
            "type": "string",
            "description": "List of column ids named in the summary"
        }
    },
    "required": ["summary"]
}

label_schema = {
    "type": "object",
    "description": "Label for a set of data points and related reasoning",
    "properties": {
        "label": {
            "type": "string",
            "description": "The label for the set of data points"
        },
        "reasoning": {
            "type": "string",
            "description": "Reasoning for the chosen data label"
        },
        "related_data": {
            "type": "list",
            "description": "List of related sets of data points"
        }
    },
    "required": ["label"]
}