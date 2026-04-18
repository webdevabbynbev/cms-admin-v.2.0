import React from "react";
import { Card } from "antd";

const LookerStudioPanel: React.FC = () => {
    return (
        <Card className="shadow-sm">
            <div style={{ width: "100%", height: "800px", overflow: "hidden" }}>
                <iframe
                    width="100%"
                    height="100%"
                    src="https://lookerstudio.google.com/embed/reporting/3ce1e429-541f-44d5-9590-65eb335c5f93/page/XSoTF"
                    frameBorder="0"
                    style={{ border: 0 }}
                    allowFullScreen
                    sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                ></iframe>
            </div>
        </Card>
    );
};

export default LookerStudioPanel;
