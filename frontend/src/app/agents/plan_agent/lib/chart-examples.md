# Chart Examples

Below are examples of different chart types that can be rendered using our custom chart renderer.

## Bar Chart Example

```chart-bar
{
  "data": [
    {
      "name": "Jan",
      "sales": 4000,
      "revenue": 2400
    },
    {
      "name": "Feb",
      "sales": 3000,
      "revenue": 1398
    },
    {
      "name": "Mar",
      "sales": 2000,
      "revenue": 9800
    },
    {
      "name": "Apr",
      "sales": 2780,
      "revenue": 3908
    },
    {
      "name": "May",
      "sales": 1890,
      "revenue": 4800
    },
    {
      "name": "Jun",
      "sales": 2390,
      "revenue": 3800
    }
  ],
  "config": {
    "xAxisDataKey": "name",
    "bars": [
      {
        "dataKey": "sales",
        "fill": "#8884d8",
        "name": "Monthly Sales"
      },
      {
        "dataKey": "revenue",
        "fill": "#82ca9d",
        "name": "Monthly Revenue"
      }
    ],
    "height": 300
  }
}
```

## Pie Chart Example

```chart-pie
{
  "data": [
    {
      "name": "Group A",
      "value": 400
    },
    {
      "name": "Group B",
      "value": 300
    },
    {
      "name": "Group C",
      "value": 300
    },
    {
      "name": "Group D",
      "value": 200
    },
    {
      "name": "Group E",
      "value": 150
    }
  ],
  "config": {
    "height": 350,
    "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF"]
  }
}
```

## Line Chart Example

```chart-line
{
  "data": [
    {
      "month": "Jan",
      "active": 4000,
      "inactive": 2400
    },
    {
      "month": "Feb",
      "active": 3000,
      "inactive": 1398
    },
    {
      "month": "Mar",
      "active": 5000,
      "inactive": 3800
    },
    {
      "month": "Apr",
      "active": 2780,
      "inactive": 3908
    },
    {
      "month": "May",
      "active": 1890,
      "inactive": 2800
    },
    {
      "month": "Jun",
      "active": 2390,
      "inactive": 3800
    }
  ],
  "config": {
    "xAxisDataKey": "month",
    "lines": [
      {
        "dataKey": "active",
        "stroke": "#8884d8",
        "name": "Active Users",
        "strokeWidth": 2
      },
      {
        "dataKey": "inactive",
        "stroke": "#82ca9d",
        "name": "Inactive Users",
        "strokeWidth": 2,
        "dot": false
      }
    ],
    "height": 300
  }
}
```

## Flow Chart Example

```chart-flow
{
  "data": {
    "nodes": [
      {
        "id": "1",
        "type": "input",
        "data": { "label": "Start" },
        "position": { "x": 250, "y": 25 }
      },
      {
        "id": "2",
        "data": { "label": "Process Data" },
        "position": { "x": 100, "y": 125 }
      },
      {
        "id": "3",
        "data": { "label": "Make Decision" },
        "position": { "x": 400, "y": 125 }
      },
      {
        "id": "4",
        "type": "output",
        "data": { "label": "End" },
        "position": { "x": 250, "y": 250 }
      }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true },
      { "id": "e1-3", "source": "1", "target": "3" },
      { "id": "e2-4", "source": "2", "target": "4" },
      { "id": "e3-4", "source": "3", "target": "4", "animated": true }
    ]
  },
  "config": {
    "height": 400
  }
}
``` 