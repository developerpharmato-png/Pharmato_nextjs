// Swagger documentation for customer notification API
export const customerNotificationSwagger = {
    '/api/customer/notifications': {
        post: {
            tags: ['Customer'],
            summary: 'Send notification to customer (dummy)',
            description: 'Dummy endpoint to simulate sending a notification to a customer. No request body required.',
            requestBody: {
                required: false,
            },
            responses: {
                200: {
                    description: 'Notification sent successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    message: { type: 'string' },
                                },
                            },
                            example: {
                                success: true,
                                message: 'Notification sent to customer (dummy)',
                            },
                        },
                    },
                },
            },
        },
    },
};
