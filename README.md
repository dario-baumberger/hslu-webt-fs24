# HSLU WEBT FS24 Final Porject

## API Documentation

### Endpoints

#### `/api/locations`

##### GET

Retrieves a list of locations.

###### Parameters

None.

###### Response

A JSON array of location objects. Each object has the following properties:

- `id`: The location's unique identifier.
- `name`: The location's name.

Example response:

```json
[
	{
		"id": 1,
		"name": "Location 1"
	},
	{
		"id": 2,
		"name": "Location 2"
	}
]
```

##### POST

Creates a new location.

###### Parameters

- name: The name of the location to create.

###### Response

A JSON object representing the newly created location.

Example response:

```json
    "name": "Location 3"
```
