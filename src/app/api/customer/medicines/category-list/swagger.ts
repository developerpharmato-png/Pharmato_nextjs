/**
 * @swagger
 * /api/customer/medicines/category-list:
 *   post:
 *     summary: Get filtered medicine list by category and subcategory
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 example: "CATEGORY_OBJECT_ID"
 *               subCategoryId:
 *                 type: string
 *                 example: "SUBCATEGORY_OBJECT_ID"
 *               limit:
 *                 type: integer
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 example: 0
 *               manufacturer:
 *                 type: string
 *                 example: "Cipla"
 *               minPrice:
 *                 type: number
 *                 example: 50
 *               maxPrice:
 *                 type: number
 *                 example: 500
 *               search:
 *                 type: string
 *                 example: "paracetamol"
 *               sortBy:
 *                 type: string
 *                 example: "ASC"
 *               columnName:
 *                 type: string
 *                 example: "createdAt"
 *     responses:
 *       200:
 *         description: Filtered medicine list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       manufacturer:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       price:
 *                         type: number
 *                       mrp:
 *                         type: number
 *                       discount:
 *                         type: number
 *                       description:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       categoryId:
 *                         type: string
 *                       subCategoryId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 manufacturerList:
 *                   type: array
 *                   items:
 *                     type: string
 */
