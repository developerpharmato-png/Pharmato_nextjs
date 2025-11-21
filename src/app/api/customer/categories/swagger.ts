/**
 * @swagger
 * /api/customer/categories:
 *   post:
 *     summary: Get category and subcategory list for customers
 *     description: Returns categories and their subcategories. Optionally filter for OTC categories only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otcOnly:
 *                 type: boolean
 *                 description: If true, only OTC categories are returned.
 *                 example: true
 *     responses:
 *       200:
 *         description: Category and subcategory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
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
 *                       icon:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       subcategories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             description:
 *                               type: string
 *                             isOTC:
 *                               type: boolean
 *                             isActive:
 *                               type: boolean
 */
