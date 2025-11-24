# Pharmato Next.js Customer API Documentation

Below are the main customer-facing API endpoints, their request bodies, and example responses.

---

## 1. `/api/customer/categories` (POST)
**Description:** Get category and subcategory list for customers (with OTC filter, pagination, and search)

### Request Body
```json
{
  "otcOnly": true,
  "limit": 10,
  "offset": 0,
  "search": "Pain"
}
```

### Example Response
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "categories": [
    {
      "_id": "...",
      "name": "Pain Relief",
      "description": "...",
      "isOTC": true,
      "images": ["..."],
      "isActive": true,
      "subcategories": [
        {
          "_id": "...",
          "name": "Headache",
          "description": "...",
          "isOTC": true,
          "isActive": true,
          "images": ["..."]
        }
      ]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "search": "Pain"
}
```

---

## 2. `/api/customer/subcategories` (POST)
**Description:** Get subcategory list for a category (with pagination and search)

### Request Body
```json
{
  "categoryId": "CATEGORY_OBJECT_ID",
  "limit": 10,
  "offset": 0,
  "search": "Headache"
}
```

### Example Response
```json
{
  "success": true,
  "message": "Subcategories fetched successfully",
  "subcategories": [
    {
      "_id": "...",
      "name": "Headache",
      "description": "...",
      "isOTC": true,
      "isActive": true,
      "images": ["..."]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "search": "Headache"
}
```

---

## 3. `/api/customer/medicines` (POST)
**Description:** Get paginated medicine list for customers (with search)

### Request Body
```json
{
  "limit": 10,
  "offset": 0,
  "search": "paracetamol"
}
```

### Example Response
```json
{
  "medicines": [
    {
      "_id": "...",
      "name": "Paracetamol",
      "description": "...",
      "price": 50,
      "isActive": true
    }
  ],
  "total": 1
}
```

---

## 4. `/api/customer/category/medicines-list` (POST)
**Description:** Get filtered medicine list by category and subcategory (with manufacturer, price, search, sort)

### Request Body
```json
{
  "categoryId": "CATEGORY_OBJECT_ID",
  "subCategoryId": "SUBCATEGORY_OBJECT_ID",
  "limit": 10,
  "offset": 0,
  "manufacturer": "Cipla",
  "minPrice": 50,
  "maxPrice": 500,
  "search": "paracetamol",
  "sortBy": "ASC",
  "columnName": "createdAt"
}
```

### Example Response
```json
{
  "status": true,
  "data": [
    {
      "_id": "...",
      "name": "Paracetamol",
      "manufacturer": "Cipla",
      "images": ["..."],
      "price": 50,
      "mrp": 60,
      "discount": 10,
      "description": "...",
      "isActive": true,
      "categoryId": "...",
      "subCategoryId": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "manufacturerList": ["Cipla"]
}
```

---

## 5. `/api/customer/medicines/detail` (GET)
**Description:** Get medicine detail for customer

### Request Example
```
GET /api/customer/medicines/detail?id=MEDICINE_OBJECT_ID
```

### Example Response
```json
{
  "_id": "...",
  "name": "Paracetamol",
  "description": "...",
  "manufacturer": "Cipla",
  "category": { ... },
  "subcategory": { ... },
  "price": 50,
  "stock": 100,
  "expiryDate": "2025-12-31T00:00:00.000Z",
  "batchNumber": "B12345",
  "isOTC": true,
  "isPrescription": false,
  "isActive": true,
  "composition": [
    { "name": "Paracetamol", "value": "500mg" }
  ],
  "images": ["..."],
  "highlights": ["Fast relief"],
  "relatedProducts": ["..."],
  "rating": { "average": 4.5, "count": 100 }
}
```

---

## 6. `/api/customer/refresh-token` (POST)
**Description:** Generate new access token using refresh token

### Request Body
```json
{
  "userId": "USER_OBJECT_ID",
  "refreshToken": "REFRESH_TOKEN"
}
```

### Example Response
```json
{
  "success": true,
  "accessToken": "NEW_ACCESS_TOKEN",
  "user": { ... }
}
```

---

## 7. `/api/customer/logout` (POST)
**Description:** Logout customer and clear refresh/device token

### Request Body
```json
{
  "userId": "USER_OBJECT_ID"
}
```

### Example Response
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 8. `/api/customer/login` (POST)
**Description:** Login with mobile number (send OTP)

### Request Body
```json
{
  "mobile": "9876543210",
  "countryCode": "+91"
}
```

### Example Response
```json
{
  "success": true,
  "message": "OTP sent",
  "otp": "123456",
  "userId": "USER_OBJECT_ID"
}
```
