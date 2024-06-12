
# HSLU WEBT FS24 Final Project

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

Status Codes:

- `200 OK` on success
- `500 Internal Server Error` if there is a server error

##### POST

Creates a new location.

###### Parameters

- `name`: The name of the location to create.

###### Response

A JSON object representing the newly created location.

Example response:

```json
{
    "id": 3,
    "name": "Location 3"
}
```

Status Codes:

- `201 Created` on success
- `400 Bad Request` if the request is malformed or missing parameters
- `500 Internal Server Error` if there is a server error

#### `/api/search`

##### GET

Searches for locations based on query parameters.

###### Parameters

- Any combination of the following parameters can be used to filter the search results:
  - `name`: The name of the location to search for.
  - `postal_code`: The postal code of the location.
  - `locality`: The locality (city/town) of the location.
  - `type`: The type of location (e.g., restaurant, cafe).

###### Response

A JSON array of location objects matching the search criteria. Each object has the following properties:

- `id`: The location's unique identifier.
- `name`: The location's name.
- `postal_code`: The postal code of the location.
- `locality`: The locality (city/town) of the location.
- `type`: The type of location.
- `website`: The website URL of the location, if available.
- `url`: The Google Maps URL of the location, if available.

Example response:

```json
[
    {
        "id": 1,
        "name": "Location 1",
        "postal_code": "1234",
        "locality": "City 1",
        "type": "Restaurant",
        "website": "http://example.com",
        "url": "http://maps.google.com/?q=Location+1"
    },
    {
        "id": 2,
        "name": "Location 2",
        "postal_code": "5678",
        "locality": "City 2",
        "type": "Cafe",
        "website": "http://example2.com",
        "url": "http://maps.google.com/?q=Location+2"
    }
]
```

Status Codes:

- `200 OK` on success
- `400 Bad Request` if the query parameters are invalid
- `500 Internal Server Error` if there is a server error

Example requests:

- Search by name:
  ```
  GET /api/search?name=Location+1
  ```

- Search by postal code:
  ```
  GET /api/search?postal_code=1234
  ```

- Search by locality:
  ```
  GET /api/search?locality=City+1
  ```


