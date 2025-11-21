"use client";
import React, { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerPage() {
    const [spec, setSpec] = useState<any>(null);
    useEffect(() => {
        fetch("/api/swagger-doc")
            .then((res) => res.json())
            .then(setSpec);
    }, []);
    return (
        <div className="min-h-screen bg-white p-4">
            <h1 className="text-3xl font-bold mb-4">API Docs (Swagger)</h1>
            {spec ? (
                <SwaggerUI spec={spec} />
            ) : (
                <div>Loading Swagger spec...</div>
            )}
        </div>
    );
}
