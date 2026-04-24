'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { memo, useCallback, useEffect, useState } from 'react';

import type { GalleryItemRecord } from '@/database/schemas/galleryItem';
import { lambdaClient } from '@/libs/trpc/client';

const Gallery = memo(() => {
  const [items, setItems] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lambdaClient.galleryItem.listAll.query();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = useCallback(
    async (id: string) => {
      await lambdaClient.galleryItem.delete.mutate({ id });
      fetchItems();
    },
    [fetchItems],
  );

  const handleToggleVisible = useCallback(
    async (id: string, visible: boolean) => {
      await lambdaClient.galleryItem.update.mutate({ id, visible });
      fetchItems();
    },
    [fetchItems],
  );

  const handleCreate = useCallback(async () => {
    const values = await form.validateFields();
    await lambdaClient.galleryItem.create.mutate(values);
    form.resetFields();
    setModalOpen(false);
    fetchItems();
  }, [form, fetchItems]);

  const columns: ColumnsType<GalleryItemRecord> = [
    {
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record) =>
        record.type === 'video' ? (
          <video src={url} style={{ height: 60, objectFit: 'cover', width: 80 }} />
        ) : (
          <img alt="" src={url} style={{ height: 60, objectFit: 'cover', width: 80 }} />
        ),
      title: 'Preview',
      width: 100,
    },
    { dataIndex: 'title', key: 'title', title: 'Title' },
    { dataIndex: 'type', key: 'type', title: 'Type', width: 80 },
    { dataIndex: 'sortOrder', key: 'sortOrder', title: 'Order', width: 80 },
    {
      dataIndex: 'visible',
      key: 'visible',
      render: (visible: boolean, record) => (
        <Switch checked={visible} onChange={(v) => handleToggleVisible(record.id, v)} />
      ),
      title: 'Visible',
      width: 80,
    },
    {
      key: 'actions',
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDelete(record.id)}>
          Delete
        </Button>
      ),
      title: 'Actions',
      width: 80,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Button icon={<PlusOutlined />} type="primary" onClick={() => setModalOpen(true)}>
        Add Item
      </Button>

      <Table columns={columns} dataSource={items} loading={loading} rowKey="id" size="small" />

      <Modal
        open={modalOpen}
        title="Add Gallery Item"
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
      >
        <Form
          form={form}
          initialValues={{ sortOrder: 0, type: 'image', visible: true }}
          layout="vertical"
        >
          <Form.Item label="URL" name="url" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Type" name="type">
            <Select
              options={[
                { label: 'Image', value: 'image' },
                { label: 'Video', value: 'video' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Title" name="title">
            <Input placeholder="Optional title" />
          </Form.Item>
          <Form.Item label="Sort Order" name="sortOrder">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item label="Visible" name="visible" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
});

Gallery.displayName = 'Gallery';
export default Gallery;
