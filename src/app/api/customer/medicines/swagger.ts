/**
 * @swagger
 * /api/customer/medicines:
 *   post:
 *     summary: Get paginated medicine list for customers
 *     description: Returns a list of medicines with pagination support (limit and offset).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 description: Number of medicines to return
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 description: Number of medicines to skip
 *                 example: 0
 *     responses:
 *       200:
 *         description: Paginated medicine list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medicines:
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
 *                       price:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                 total:
 *                   type: integer
 *                   description: Total number of active medicines
 */
