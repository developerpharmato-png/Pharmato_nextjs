/**
 * @swagger
 * /api/customer/subcategories:
 *   post:
 *     summary: Get subcategory list for customers
 *     description: Returns subcategories for a given categoryId, with pagination and search.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 description: The ID of the category to filter subcategories.
 *                 example: "6560e7c2e7b1a2a1b8e7c2e7"
 *               limit:
 *                 type: integer
 *                 description: Number of subcategories per page.
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 description: Number of subcategories to skip.
 *                 example: 0
 *               search:
 *                 type: string
 *                 description: Search term for subcategory name.
 *                 example: "pain"
 *     responses:
 *       200:
 *         description: Subcategory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subcategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       isOTC:
 *                         type: boolean
 *                       isActive:
 *                         type: boolean
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 */
