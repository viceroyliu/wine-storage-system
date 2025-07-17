import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    SearchBar,
    Card,
    Button,
    Toast,
    PullToRefresh,
    Empty,
    SwipeAction,
    Dialog,
    Form,
    Input
} from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { wineAPI } from '../services/api';

const WineList = () => {
    const navigate = useNavigate();
    const [wines, setWines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [stockInVisible, setStockInVisible] = useState(false);
    const [stockOutVisible, setStockOutVisible] = useState(false);
    const [addWineVisible, setAddWineVisible] = useState(false);
    const [selectedWine, setSelectedWine] = useState(null);
    const [stockInForm] = Form.useForm();
    const [stockOutForm] = Form.useForm();
    const [addWineForm] = Form.useForm();

    // 禁用body滚动
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100vh';

        return () => {
            document.body.style.overflow = '';
            document.body.style.height = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
        };
    }, []);

    useEffect(() => {
        loadWines();
    }, [searchText]);

    const loadWines = async (isRefresh = true) => {
        try {
            setLoading(true);
            const params = {};

            if (searchText) {
                params.search = searchText;
            }

            const response = await wineAPI.getWines(params);
            setWines(response.data);
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: '加载失败'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await loadWines(true);
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const formatNumber = (num) => {
        return Number(num).toFixed(2).replace(/\.?0+$/, '');
    };

    // 新增酒水
    const handleAddWine = async (values) => {
        try {
            const wineData = {
                name: values.name.trim(),
                type: values.type.trim(),
                unpackagedBoxes: 0,
                packagedBoxes: 0,
                remainingWater: 0,
                remark: values.remark || '新增酒水'
            };

            await wineAPI.createWine(wineData);

            Toast.show({
                icon: 'success',
                content: '酒水新增成功'
            });

            setAddWineVisible(false);
            addWineForm.resetFields();
            loadWines();
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '新增失败'
            });
        }
    };

    // 入库操作
    const handleStockIn = (wine) => {
        setSelectedWine(wine);
        stockInForm.resetFields();
        setStockInVisible(true);
    };

    const handleStockInSubmit = async (values) => {
        try {
            await wineAPI.stockIn(selectedWine._id, {
                unpackagedBoxes: values.unpackagedBoxes || 0,
                packagedBoxes: 0,
                remainingWater: 0,
                remark: values.remark || '手动入库'
            });

            Toast.show({
                icon: 'success',
                content: '入库成功'
            });

            setStockInVisible(false);
            stockInForm.resetFields();
            loadWines();
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '入库失败'
            });
        }
    };

    // 出库操作
    const handleStockOut = (wine) => {
        setSelectedWine(wine);
        stockOutForm.resetFields();
        setStockOutVisible(true);
    };

    const handleStockOutSubmit = async (values) => {
        try {
            await wineAPI.stockOut(selectedWine._id, {
                unpackagedBoxes: 0,
                packagedBoxes: values.packagedBoxes || 0,
                remainingWater: 0,
                remark: values.remark || '手动出库'
            });

            Toast.show({
                icon: 'success',
                content: '出库成功'
            });

            setStockOutVisible(false);
            stockOutForm.resetFields();
            loadWines();
        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '出库失败'
            });
        }
    };

    const WineCard = ({ wine }) => {
        const rightActions = [
            {
                key: 'stock-out',
                text: '出库',
                color: 'danger',
                onClick: () => handleStockOut(wine)
            }
        ];

        const leftActions = [
            {
                key: 'stock-in',
                text: '入库',
                color: 'primary',
                onClick: () => handleStockIn(wine)
            }
        ];

        return (
            <SwipeAction
                leftActions={leftActions}
                rightActions={rightActions}
                closeOnAction={false}
                style={{
                    '--action-width': '80px',
                }}
            >
                <Card
                    style={{
                        margin: '0 12px 10px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
                    }}
                    bodyStyle={{ padding: '16px' }}
                    onClick={() => navigate(`/wines/${wine._id}`)}
                >
                    {/* 酒水名称和类型 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '17px',
                            fontWeight: '600',
                            color: '#1a1a1a',
                            flex: 1,
                            lineHeight: '1.3'
                        }}>
                            {wine.name}
                        </div>
                        <div style={{
                            fontSize: '13px',
                            color: '#666',
                            background: '#f8f9fa',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            marginLeft: '12px',
                            border: '1px solid #e9ecef'
                        }}>
                            {wine.type}
                        </div>
                    </div>

                    {/* 库存信息 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '10px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '10px 6px',
                            background: '#f0f9ff',
                            borderRadius: '8px',
                            border: '1px solid #e0f2fe'
                        }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0ea5e9', marginBottom: '2px' }}>
                                {wine.unpackagedBoxes}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                未罐装箱
                            </div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '10px 6px',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                            border: '1px solid #dcfce7'
                        }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#22c55e', marginBottom: '2px' }}>
                                {wine.packagedBoxes}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                已罐装箱
                            </div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '10px 6px',
                            background: '#fffbeb',
                            borderRadius: '8px',
                            border: '1px solid #fef3c7'
                        }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b', marginBottom: '2px' }}>
                                {formatNumber(wine.remainingWater)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                剩余水
                            </div>
                        </div>
                    </div>

                    {/* 底部信息 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #f1f5f9'
                    }}>
                        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                            总库存: {wine.totalStock} 箱
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            更新日期: {new Date(wine.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                </Card>
            </SwipeAction>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fafafa',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 头部 - 固定 */}
            <div style={{
                background: 'white',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0,
                zIndex: 10
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600', margin: 0, color: '#1a1a1a' }}>
                        酒水管理
                    </h1>
                    <Button
                        color='primary'
                        size='small'
                        onClick={() => setAddWineVisible(true)}
                        style={{
                            borderRadius: '8px',
                            fontWeight: '500'
                        }}
                    >
                        <AddOutline /> 新增
                    </Button>
                </div>

                <SearchBar
                    placeholder='搜索酒水名称或类型'
                    onSearch={handleSearch}
                    onClear={() => handleSearch('')}
                    style={{
                        '--border-radius': '12px',
                        '--background': '#f8f9fa'
                    }}
                />
            </div>

            {/* 酒水列表 - 可滚动 */}
            <div style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '50px',
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <PullToRefresh onRefresh={handleRefresh}>
                        <div style={{ padding: '12px 0 0px' }}>
                            {wines.length === 0 ? (
                                <Empty
                                    style={{ padding: '64px 0' }}
                                    imageStyle={{ width: 128 }}
                                    description="暂无数据"
                                />
                            ) : (
                                wines.map(wine => (
                                    <WineCard key={wine._id} wine={wine} />
                                ))
                            )}
                        </div>
                    </PullToRefresh>
                </div>
            </div>

            {/* 新增酒水对话框 */}
            <Dialog
                visible={addWineVisible}
                title='新增酒水'
                closeOnMaskClick={true}
                onClose={() => setAddWineVisible(false)}
                content={
                    <Form
                        form={addWineForm}
                        onFinish={handleAddWine}
                        layout='vertical'
                        footer={
                            <Button block color='primary' type='submit'>
                                确认新增
                            </Button>
                        }
                    >
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            添加新的酒水品种，库存数量可在【新增罐装】中修改
                        </div>

                        <Form.Item
                            name='name'
                            label='酒水名称'
                            rules={[
                                { required: true, message: '请输入酒水名称' },
                                { min: 2, message: '酒水名称至少2个字符' },
                                { max: 50, message: '酒水名称不能超过50个字符' }
                            ]}
                        >
                            <Input
                                placeholder='请输入酒水名称'
                                clearable
                                style={{ fontSize: '16px' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name='type'
                            label='酒水类型'
                            rules={[
                                { required: true, message: '请输入酒水类型' },
                                { min: 2, message: '酒水类型至少2个字符' },
                                { max: 30, message: '酒水类型不能超过30个字符' }
                            ]}
                        >
                            <Input
                                placeholder='如：白酒、红酒、啤酒等'
                                clearable
                                style={{ fontSize: '16px' }}
                            />
                        </Form.Item>

                        <Form.Item name='remark' label='备注'>
                            <Input
                                placeholder='请输入备注信息（可选）'
                                clearable
                                style={{ fontSize: '16px' }}
                            />
                        </Form.Item>

                        <div style={{
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#1890ff',
                            marginTop: '16px'
                        }}>
                            💡 温馨提示：
                            <br />• 新增的酒水初始库存为0
                            <br />• 可通过【新增罐装】页面或滑动操作来管理库存
                            <br />• 酒水名称和类型创建后可在详情页修改
                        </div>
                    </Form>
                }
            />

            {/* 入库对话框 */}
            <Dialog
                visible={stockInVisible}
                title='酒水入库'
                closeOnMaskClick={true}
                onClose={() => setStockInVisible(false)}
                content={
                    <div style={{ padding: '4px 8px' }}>
                        {selectedWine && (
                            <div style={{
                                background: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>
                                    {selectedWine.name} ({selectedWine.type})
                                </div>
                                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                                    当前未罐装库存: {selectedWine.unpackagedBoxes} 箱
                                </div>
                            </div>
                        )}

                        <Form
                            form={stockInForm}
                            onFinish={handleStockInSubmit}
                            layout='vertical'
                            footer={
                                <Button
                                    block
                                    color='primary'
                                    type='submit'
                                    size='large'
                                    style={{
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        marginTop: '20px'
                                    }}
                                >
                                    确认入库
                                </Button>
                            }
                        >
                            <Form.Item
                                name='unpackagedBoxes'
                                label='入库数量 (未罐装箱)'
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            const num = Number(value);
                                            if (!value || value === '') {
                                                return Promise.reject('请输入入库的未罐装箱数');
                                            }
                                            if (isNaN(num) || num <= 0) {
                                                return Promise.reject('入库数量必须大于0');
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                            >
                                <Input
                                    type='number'
                                    placeholder='请输入入库的未罐装箱数'
                                    style={{
                                        '--border-radius': '8px',
                                        '--font-size': '16px'
                                    }}
                                />
                            </Form.Item>

                            <Form.Item name='remark' label='备注信息'>
                                <Input
                                    placeholder='请输入备注信息（可选）'
                                    style={{
                                        '--border-radius': '8px',
                                        '--font-size': '16px'
                                    }}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                }
            />

            {/* 出库对话框 */}
            <Dialog
                visible={stockOutVisible}
                title='酒水出库'
                closeOnMaskClick={true}
                onClose={() => setStockOutVisible(false)}
                content={
                    <div style={{ padding: '4px 8px' }}>
                        {selectedWine && (
                            <div style={{
                                background: '#fff5f5',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: '1px solid #fed7d7'
                            }}>
                                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>
                                    {selectedWine.name} ({selectedWine.type})
                                </div>
                                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                                    当前已罐装库存: {selectedWine.packagedBoxes} 箱
                                </div>
                            </div>
                        )}

                        <Form
                            form={stockOutForm}
                            onFinish={handleStockOutSubmit}
                            layout='vertical'
                            footer={
                                <Button
                                    block
                                    color='danger'
                                    type='submit'
                                    size='large'
                                    style={{
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        marginTop: '20px'
                                    }}
                                >
                                    确认出库
                                </Button>
                            }
                        >
                            <Form.Item
                                name='packagedBoxes'
                                label='出库数量 (已罐装箱)'
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            const num = Number(value);
                                            if (!value || value === '') {
                                                return Promise.reject('请输入出库的已罐装箱数');
                                            }
                                            if (isNaN(num) || num <= 0) {
                                                return Promise.reject('出库数量必须大于0');
                                            }
                                            if (selectedWine && num > selectedWine.packagedBoxes) {
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
                                    style={{
                                        '--border-radius': '8px',
                                        '--font-size': '16px'
                                    }}
                                />
                            </Form.Item>

                            <Form.Item name='remark' label='备注信息'>
                                <Input
                                    placeholder='请输入备注信息（可选）'
                                    style={{
                                        '--border-radius': '8px',
                                        '--font-size': '16px'
                                    }}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                }
            />
        </div>
    );
};

export default WineList;
