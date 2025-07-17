import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    NavBar,
    Card,
    Button,
    Form,
    Input,
    Dialog,
    Toast,
    Space
} from 'antd-mobile';
import { LeftOutline, EditSOutline, DeleteOutline } from 'antd-mobile-icons';
import { wineAPI } from '../services/api';

const WineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wine, setWine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editForm] = Form.useForm();
    const [editVisible, setEditVisible] = useState(false);
    const [stockInForm] = Form.useForm();
    const [stockOutForm] = Form.useForm();
    const [stockInVisible, setStockInVisible] = useState(false);
    const [stockOutVisible, setStockOutVisible] = useState(false);

    useEffect(() => {
        loadWineDetail();
    }, [id]);

    const loadWineDetail = async () => {
        try {
            setLoading(true);
            const response = await wineAPI.getWine(id);
            setWine(response.data);

            // 设置表单初始值
            editForm.setFieldsValue({
                unpackagedBoxes: response.data.unpackagedBoxes,
                packagedBoxes: response.data.packagedBoxes,
                remainingWater: response.data.remainingWater
            });
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: '加载失败'
            });
            navigate('/wines');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (values) => {
        try {
            const response = await wineAPI.updateWine(id, {
                ...values,
                remark: values.remark || '手动更新库存'
            });

            setWine(response.data.wine);
            setEditVisible(false);
            Toast.show({
                icon: 'success',
                content: '更新成功'
            });
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '更新失败'
            });
        }
    };

    const handleStockIn = async (values) => {
        try {
            const response = await wineAPI.stockIn(id, {
                unpackagedBoxes: values.unpackagedBoxes || 0,
                packagedBoxes: 0,
                remainingWater: 0,
                remark: values.remark || '手动入库'
            });

            setWine(response.data.wine);
            setStockInVisible(false);
            stockInForm.resetFields();
            Toast.show({
                icon: 'success',
                content: '入库成功'
            });
            loadWineDetail(); // 重新加载数据
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '入库失败'
            });
        }
    };

    const handleStockOut = async (values) => {
        try {
            const response = await wineAPI.stockOut(id, {
                unpackagedBoxes: 0,
                packagedBoxes: values.packagedBoxes || 0,
                remainingWater: 0,
                remark: values.remark || '手动出库'
            });

            setWine(response.data.wine);
            setStockOutVisible(false);
            stockOutForm.resetFields();
            Toast.show({
                icon: 'success',
                content: '出库成功'
            });
            loadWineDetail(); // 重新加载数据
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '出库失败'
            });
        }
    };

    const handleDeleteWine = async () => {
        const result = await Dialog.confirm({
            content: `确定要删除酒水 "${wine.name}" 吗？此操作不可恢复！`,
            confirmText: '删除',
            cancelText: '取消',
            closeOnMaskClick: true // 允许点击遮罩关闭
        });

        if (result) {
            try {
                await wineAPI.deleteWine(id);

                Toast.show({
                    icon: 'success',
                    content: '酒水删除成功'
                });

                // 返回列表页
                navigate('/wines');
            } catch (error) {
                Toast.show({
                    icon: 'fail',
                    content: error.response?.data?.message || '删除失败'
                });
            }
        }
    };

    const formatNumber = (num) => {
        return Number(num).toFixed(2).replace(/\.?0+$/, '');
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                加载中...
            </div>
        );
    }

    if (!wine) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                酒水不存在
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
            <NavBar
                back='返回'
                onBack={() => navigate('/wines')}
            >
                酒水详情
            </NavBar>

            <div style={{ padding: '16px' }}>
                {/* 基本信息 */}
                <Card style={{ marginBottom: '16px', borderRadius: '12px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '500', margin: '0 0 8px 0' }}>
                            {wine.name}
                        </h2>
                        <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                            {wine.type}
                        </div>
                    </div>

                    <div style={{
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            总库存容量
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '500', color: '#1890ff' }}>
                            {wine.totalStock} 箱
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        fontSize: '14px',
                        color: '#999',
                        justifyContent: 'space-between'
                    }}>
                        <span>创建时间: {new Date(wine.createdAt).toLocaleString()}</span>
                        <span>更新时间: {new Date(wine.updatedAt).toLocaleString()}</span>
                    </div>
                </Card>

                {/* 库存详情 */}
                <Card style={{ marginBottom: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                        库存详情
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: '500', color: '#1890ff', marginBottom: '4px' }}>
                                {wine.unpackagedBoxes}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                                未罐装箱数
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: '500', color: '#52c41a', marginBottom: '4px' }}>
                                {wine.packagedBoxes}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                                已罐装箱数
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '16px', background: '#fff7e6', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '500', color: '#fa8c16', marginBottom: '4px' }}>
                            {formatNumber(wine.remainingWater)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            剩余水
                        </div>
                    </div>
                </Card>

                {/* 操作按钮 */}
                <Card style={{ borderRadius: '12px' }}>
                    <Space direction='vertical' style={{ width: '100%' }}>
                        <Button
                            block
                            color='primary'
                            onClick={() => setEditVisible(true)}
                        >
                            <EditSOutline /> 更新库存
                        </Button>
                        <Button
                            block
                            fill='outline'
                            color='primary'
                            onClick={() => {
                                stockInForm.resetFields();
                                setStockInVisible(true);
                            }}
                        >
                            酒水入库
                        </Button>
                        <Button
                            block
                            color='warning'
                            fill='outline'
                            onClick={() => {
                                stockOutForm.resetFields();
                                setStockOutVisible(true);
                            }}
                        >
                            酒水出库
                        </Button>
                        <Button
                            block
                            color='danger'
                            fill='outline'
                            onClick={handleDeleteWine}
                        >
                            <DeleteOutline /> 删除酒水
                        </Button>
                    </Space>
                </Card>
            </div>

            {/* 更新库存对话框 */}
            <Dialog
                visible={editVisible}
                title='更新库存'
                closeOnMaskClick={true}
                onClose={() => setEditVisible(false)}
                content={
                    <Form
                        form={editForm}
                        onFinish={handleEdit}
                        layout='vertical'
                        footer={
                            <Space style={{ width: '100%' }}>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={() => setEditVisible(false)}
                                >
                                    取消
                                </Button>
                                <Button block color='primary' type='submit'>
                                    确定
                                </Button>
                            </Space>
                        }
                    >
                        <Form.Item name='unpackagedBoxes' label='未罐装箱数'>
                            <Input type='number' placeholder='请输入未罐装箱数' />
                        </Form.Item>

                        <Form.Item name='packagedBoxes' label='已罐装箱数'>
                            <Input type='number' placeholder='请输入已罐装箱数' />
                        </Form.Item>

                        <Form.Item name='remainingWater' label='剩余水'>
                            <Input type='number' step='0.01' placeholder='请输入剩余水量' />
                        </Form.Item>

                        <Form.Item name='remark' label='备注'>
                            <Input placeholder='请输入备注信息（可选）' />
                        </Form.Item>
                    </Form>
                }
            />

            {/* 入库对话框 - 只有未罐装箱数 */}
            <Dialog
                visible={stockInVisible}
                title='酒水入库'
                closeOnMaskClick={true}
                onClose={() => setStockInVisible(false)}
                content={
                    <Form
                        form={stockInForm}
                        onFinish={handleStockIn}
                        layout='vertical'
                        footer={
                            <Space style={{ width: '100%' }}>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={() => setStockInVisible(false)}
                                >
                                    取消
                                </Button>
                                <Button block color='primary' type='submit'>
                                    确认入库
                                </Button>
                            </Space>
                        }
                    >
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            为 <strong>{wine.name}</strong> 增加未罐装箱数
                        </div>

                        <Form.Item
                            name='unpackagedBoxes'
                            label='未罐装箱数'
                            rules={[
                                { required: true, message: '请输入入库的未罐装箱数' },
                                { type: 'number', min: 1, message: '入库数量必须大于0' }
                            ]}
                        >
                            <Input
                                type='number'
                                placeholder='请输入入库的未罐装箱数'
                                style={{ fontSize: '16px' }}
                            />
                        </Form.Item>

                        <Form.Item name='remark' label='备注'>
                            <Input placeholder='请输入备注信息（可选）' />
                        </Form.Item>
                    </Form>
                }
            />

            {/* 出库对话框 - 只有已罐装箱数 */}
            <Dialog
                visible={stockOutVisible}
                title='酒水出库'
                closeOnMaskClick={true}
                onClose={() => setStockOutVisible(false)}
                content={
                    <Form
                        form={stockOutForm}
                        onFinish={handleStockOut}
                        layout='vertical'
                        footer={
                            <Space style={{ width: '100%' }}>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={() => setStockOutVisible(false)}
                                >
                                    取消
                                </Button>
                                <Button block color='danger' type='submit'>
                                    确认出库
                                </Button>
                            </Space>
                        }
                    >
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            从 <strong>{wine.name}</strong> 减少已罐装箱数
                            <br />
                            <span style={{ color: '#fa8c16', fontSize: '12px' }}>
                当前已罐装箱数: {wine.packagedBoxes}
              </span>
                        </div>

                        <Form.Item
                            name='packagedBoxes'
                            label='已罐装箱数'
                            rules={[
                                { required: true, message: '请输入出库的已罐装箱数' },
                                { type: 'number', min: 1, message: '出库数量必须大于0' },
                                {
                                    validator: (_, value) => {
                                        if (value && value > wine.packagedBoxes) {
                                            return Promise.reject('出库数量不能超过当前库存');
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Input
                                type='number'
                                placeholder='请输入出库的已罐装箱数'
                                style={{ fontSize: '16px' }}
                            />
                        </Form.Item>

                        <Form.Item name='remark' label='备注'>
                            <Input placeholder='请输入备注信息（可选）' />
                        </Form.Item>
                    </Form>
                }
            />
        </div>
    );
};

export default WineDetail;
