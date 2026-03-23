import { Card, Button, Modal, Tooltip } from "@agentscope-ai/design";
import { DeleteOutlined } from "@ant-design/icons";
import { Server } from "lucide-react";
import type { MCPClientInfo } from "../../../../api/types";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import styles from "../index.module.less";

interface MCPClientCardProps {
  client: MCPClientInfo;
  onToggle: (client: MCPClientInfo, e: React.MouseEvent) => void;
  onDelete: (client: MCPClientInfo, e: React.MouseEvent) => void;
  onUpdate: (key: string, updates: any) => Promise<boolean>;
  getClientTools: (key: string) => Promise<any[]>;
  testConnection: (config: any) => Promise<any>;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function MCPClientCard({
  client,
  onToggle,
  onDelete,
  onUpdate,
  getClientTools,
  testConnection,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: MCPClientCardProps) {
  const { t } = useTranslation();
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editedJson, setEditedJson] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [tools, setTools] = useState<any[]>([]);
  const [fetchingTools, setFetchingTools] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tools: any[];
  } | null>(null);

  const handleViewTools = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFetchingTools(true);
    try {
      const data = await getClientTools(client.key);
      setTools(data);
      setToolsModalOpen(true);
    } finally {
      setFetchingTools(false);
    }
  };

  const handleTestInModal = async () => {
    try {
      const parsed = JSON.parse(editedJson);
      setTesting(true);
      setTestResult(null);

      const result = await testConnection(parsed);
      setTestResult(result);
    } catch (error) {
      alert("Invalid JSON format");
    } finally {
      setTesting(false);
    }
  };

  // Determine if MCP client is remote or local based on command
  const isRemote =
    client.transport === "streamable_http" || client.transport === "sse";
  const clientType = isRemote ? "Remote" : "Local";

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(client, e);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setDeleteModalOpen(false);
    onDelete(client, null as any);
  };

  const handleCardClick = () => {
    const jsonStr = JSON.stringify(client, null, 2);
    setEditedJson(jsonStr);
    setIsEditing(false);
    setJsonModalOpen(true);
  };

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(editedJson);
      const { key, ...updates } = parsed;

      // Send all updates directly to backend, let backend handle env masking check
      const success = await onUpdate(client.key, updates);
      if (success) {
        setJsonModalOpen(false);
        setIsEditing(false);
      }
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  const clientJson = JSON.stringify(client, null, 2);

  return (
    <>
      <Card
        hoverable
        onClick={handleCardClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`${styles.mcpCard} ${
          client.enabled ? styles.enabledCard : ""
        } ${isHovered ? styles.hover : styles.normal}`}
      >
        <div className={styles.cardHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={styles.fileIcon}>
              <Server style={{ color: "#1890ff", fontSize: 20 }} />
            </span>
            <Tooltip title={client.name}>
              <h3 className={styles.mcpTitle}>{client.name}</h3>
            </Tooltip>
            <span
              className={`${styles.typeBadge} ${
                isRemote ? styles.remote : styles.local
              }`}
            >
              {clientType}
            </span>
          </div>
          <div className={styles.statusContainer}>
            <span
              className={`${styles.statusDot} ${
                client.enabled ? styles.enabled : styles.disabled
              }`}
            />
            <span
              className={`${styles.statusText} ${
                client.enabled ? styles.enabled : styles.disabled
              }`}
            >
              {client.enabled ? t("common.enabled") : t("common.disabled")}
            </span>
          </div>
        </div>

        <div className={styles.description}>
          {client.description || "\u00A0"}
        </div>

        <div className={styles.cardFooter}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="link"
              size="small"
              onClick={handleToggleClick}
              className={styles.actionButton}
            >
              {client.enabled ? t("common.disable") : t("common.enable")}
            </Button>
            {client.enabled && (
              <Button
                type="link"
                size="small"
                onClick={handleViewTools}
                loading={fetchingTools}
                className={styles.actionButton}
              >
                {t("mcp.viewTools")}
              </Button>
            )}
          </div>

          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            disabled={client.enabled}
          />
        </div>
      </Card>

      <Modal
        title={t("mcp.viewTools")}
        open={toolsModalOpen}
        onCancel={() => setToolsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setToolsModalOpen(false)}>
            {t("common.close")}
          </Button>,
        ]}
        width={600}
      >
        <div className={styles.toolsList}>
          {tools.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center" }}>No tools found</p>
          ) : (
            tools.map((tool: any) => (
              <div key={tool.name} className={styles.toolItem}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{tool.name}</div>
                {tool.description && (
                  <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                    {tool.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        title={t("common.confirm")}
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText={t("common.confirm")}
        cancelText={t("common.cancel")}
        okButtonProps={{ danger: true }}
      >
        <p>{t("mcp.deleteConfirm")}</p>
      </Modal>

      <Modal
        title={`${client.name} - Configuration`}
        open={jsonModalOpen}
        onCancel={() => setJsonModalOpen(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {isEditing ? (
              <Button onClick={handleTestInModal} loading={testing}>
                {t("mcp.testConnection")}
              </Button>
            ) : (
              <div />
            )}
            <div>
              <Button
                onClick={() => setJsonModalOpen(false)}
                style={{ marginRight: 8 }}
              >
                {t("common.cancel")}
              </Button>
              {isEditing ? (
                <Button type="primary" onClick={handleSaveJson}>
                  {t("common.save")}
                </Button>
              ) : (
                <Button type="primary" onClick={() => setIsEditing(true)}>
                  {t("common.edit")}
                </Button>
              )}
            </div>
          </div>
        }
        width={700}
      >
        {isEditing ? (
          <>
            <textarea
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              className={styles.editJsonTextArea}
            />
            {testResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 4,
                  backgroundColor: testResult.success ? "#f6ffed" : "#fff2f0",
                  border: `1px solid ${
                    testResult.success ? "#b7eb8f" : "#ffccc7"
                  }`,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: testResult.success ? "#52c41a" : "#ff4d4f",
                    marginBottom: 4,
                  }}
                >
                  {testResult.success ? "Success" : "Failed"}:{" "}
                  {testResult.message}
                </div>
                {testResult.tools && testResult.tools.length > 0 && (
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Available Tools ({testResult.tools.length}):
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                      }}
                    >
                      {testResult.tools.map((tool: any) => (
                        <span
                          key={tool.name}
                          style={{
                            padding: "2px 8px",
                            backgroundColor: "#fff",
                            border: "1px solid #d9d9d9",
                            borderRadius: 2,
                            fontSize: 12,
                          }}
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <pre className={styles.preformattedText}>{clientJson}</pre>
        )}
      </Modal>
    </>
  );
}
