/**
 * @swagger
 * /api/customer/medicines/detail:
 *   get:
 *     summary: Get medicine detail for customer
 *     description: Returns detailed information about a medicine, including category and subcategory.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the medicine to retrieve
 *     responses:
 *       200:
 *         description: Medicine detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 manufacturer:
 *                   type: string
 *                 category:
 *                   type: object
 *                   description: Category details
 *                 subcategory:
 *                   type: object
 *                   description: Subcategory details
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: number
 *                 expiryDate:
 *                   type: string
 *                   format: date-time
 *                 batchNumber:
 *                   type: string
 *                 isOTC:
 *                   type: boolean
 *                 isPrescription:
 *                   type: boolean
 *                 isActive:
 *                   type: boolean
 *                 composition:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       value:
 *                         type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 highlights:
 *                   type: array
 *                   items:
 *                     type: string
 *                 relatedProducts:
 *                   type: array
 *                   items:
 *                     type: string
 *                 rating:
 *                   type: object
 *                   properties:
 *                     average:
 *                       type: number
 *                     count:
 *                       type: number
 */
