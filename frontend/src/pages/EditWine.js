import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    NavBar,
    Form,
    Input,
    Button,
    Card,
    Toast,
    Space,
    CapsuleTabs
} from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { wineAPI } from '../services/api';

const EditWine = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [wines, setWines] = useState([]);
    const [selectedWine, setSelectedWine] = useState(null);
    const [activeWineKey, setActiveWineKey] = useState(null);
    const [packagedValue, setPackagedValue] = useState('');
    const [remainingWaterValue, setRemainingWaterValue] = useState('');

    // 本地存储的key
    const SELECTED_WINE_KEY = 'editWine_selectedWine';

    useEffect(() => {
        loadExistingWines();
    }, []);

    const loadExistingWines = async () => {
        try {
            const response = await wineAPI.getWines();
            setWines(response.data);

            // 从localStorage恢复上次选择的酒水
            const savedWineId = localStorage.getItem(SELECTED_WINE_KEY);
            if (savedWineId && response.data.length > 0) {
                const savedWine = response.data.find(wine => wine._id === savedWineId);
                if (savedWine) {
                    setSelectedWine(savedWine);
                    setActiveWineKey(savedWine._id);
                } else {
                    // 如果保存的酒水ID不存在了，清除localStorage
                    localStorage.removeItem(SELECTED_WINE_KEY);
                }
            }
        } catch (error) {
            console.error('加载酒水列表失败:', error);
        }
    };

    const handleWineChange = (key) => {
        const wine = wines.find(w => w._id === key);
        if (wine) {
            setSelectedWine(wine);
            setActiveWineKey(key);
            resetInputs();

            // 保存选择到localStorage
            localStorage.setItem(SELECTED_WINE_KEY, wine._id);
        }
    };

    const resetInputs = () => {
        setPackagedValue('');
        setRemainingWaterValue('');
        form.resetFields(['packagedBoxes', 'remainingWater']);
    };

    const handlePackagedChange = (value) => {
        setPackagedValue(value);
    };

    const handleRemainingWaterChange = (value) => {
        setRemainingWaterValue(value);
    };

    const formatNumber = (num) => {
        return Number(num).toFixed(2).replace(/\.?0+$/, '');
    };

    const getUnpackagedDisplay = () => {
        if (!selectedWine || !packagedValue) return null;
        const addValue = Number(packagedValue) || 0;
        const newValue = selectedWine.unpackagedBoxes - addValue;
        return `${selectedWine.unpackagedBoxes} => ${newValue}`;
    };

    const getPackagedDisplay = () => {
        if (!selectedWine || !packagedValue) return null;
        const addValue = Number(packagedValue) || 0;
        const newValue = selectedWine.packagedBoxes + addValue;
        return `${selectedWine.packagedBoxes} => ${newValue}`;
    };

    const getRemainingWaterDisplay = () => {
        if (!selectedWine || !remainingWaterValue) return null;
        const newValue = Number(remainingWaterValue) || 0;
        return `${formatNumber(selectedWine.remainingWater)} => ${formatNumber(newValue)}`;
    };

    const handleSubmit = async (values) => {
        // 验证是否选择了酒水
        if (!selectedWine) {
            Toast.show({
                icon: 'fail',
                content: '请选择要更新的酒水'
            });
            return;
        }

        const addPackaged = Number(packagedValue) || 0;
        const newWater = remainingWaterValue ? Number(remainingWaterValue) : selectedWine.remainingWater;

        if (addPackaged <= 0 && !remainingWaterValue) {
            Toast.show({
                icon: 'fail',
                content: '请至少输入一个要更新的数量'
            });
            return;
        }

        // 检查新增已罐装数量不能大于未罐装箱数
        if (addPackaged > selectedWine.unpackagedBoxes) {
            Toast.show({
                icon: 'fail',
                content: `新增已罐装数量不能大于未罐装箱数(${selectedWine.unpackagedBoxes})`
            });
            return;
        }

        try {
            setLoading(true);

            const packageData = {
                packagedBoxes: addPackaged,  // 新增的已罐装数量
                remark: '新增罐装'
            };

            // 如果有更新剩余水，则包含在数据中
            if (remainingWaterValue) {
                packageData.remainingWater = newWater;
            }

            // 修改：使用 packageWine 接口
            await wineAPI.packageWine(selectedWine._id, packageData);

            Toast.show({
                icon: 'success',
                content: '新增罐装成功'
            });

            // 成功后重新加载酒水数据，保持选择状态
            await loadExistingWines();
            // 清空输入框
            resetInputs();

        } catch (error) {
            Toast.show({
                icon: 'fail',
                content: error.response?.data?.message || '罐装失败'
            });
        } finally {
            setLoading(false);
        }
    };


    const handleReset = () => {
        resetInputs();
    };

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
            {/* 内联CSS样式 */}
            <style>
                {`
                .custom-capsule-tabs .adm-capsule-tabs-tab {
                    border-radius: 5px !important;
                    background-color: #ffffff !important;
                    border: 1px solid #d9d9d9 !important;
                    color: #333 !important;
                    margin-right: 8px !important;
                    transition: all 0.3s ease !important;
                    padding: 8px 16px !important;
                }
                
                .custom-capsule-tabs .adm-capsule-tabs-tab:hover {
                    border-color: #1890ff !important;
                }
                
                .custom-capsule-tabs .adm-capsule-tabs-tab.adm-capsule-tabs-tab-active {
                    background-color: #f0f9ff !important;
                    border-color: #1890ff !important;
                    color: #1890ff !important;
                    font-weight: 500 !important;
                }
                `}
            </style>

            <NavBar
                back='返回'
                onBack={() => navigate('/wines')}
            >
                新增罐装
            </NavBar>

            <div style={{ padding: '16px' }}>
                <Card style={{ borderRadius: '12px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '20px' }}>
                        选择酒水新增罐装
                    </div>

                    {/* 酒水选择 - 独立于Form之外 */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            选择酒水
                        </div>

                        <CapsuleTabs
                            activeKey={activeWineKey}
                            onChange={handleWineChange}
                            className="custom-capsule-tabs"
                        >
                            {wines.map(wine => (
                                <CapsuleTabs.Tab
                                    title={wine.name}
                                    key={wine._id}
                                />
                            ))}
                        </CapsuleTabs>

                        {/* 提示信息 */}
                        {!selectedWine && wines.length > 0 && (
                            <div style={{
                                fontSize: '12px',
                                color: '#999',
                                textAlign: 'center',
                                marginTop: '8px'
                            }}>
                                请点击上方标签选择要进行罐装的酒水，可左右滑动查看更多
                            </div>
                        )}
                    </div>

                    {/* 表单部分 */}
                    <Form
                        form={form}
                        onFinish={handleSubmit}
                        layout='vertical'
                        footer={
                            <Space direction='vertical' style={{ width: '100%', marginTop: '24px' }}>
                                <Button
                                    block
                                    type='submit'
                                    color='primary'
                                    loading={loading}
                                    size='large'
                                    style={{ borderRadius: '8px' }}
                                >
                                    确认新增
                                </Button>
                                <Button
                                    block
                                    fill='outline'
                                    onClick={handleReset}
                                    size='large'
                                    style={{ borderRadius: '8px' }}
                                >
                                    重置输入
                                </Button>
                            </Space>
                        }
                    >
                        {selectedWine && (
                            <>
                                {/* 选中酒水信息展示 */}
                                <div style={{
                                    background: '#f0f9ff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    border: '1px solid #bae7ff'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1890ff', marginBottom: '4px' }}>
                                        选中酒水: {selectedWine.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        类型: {selectedWine.type} | 未罐装: {selectedWine.unpackagedBoxes}箱 | 已罐装: {selectedWine.packagedBoxes}箱 | 剩余水: {formatNumber(selectedWine.remainingWater)}
                                    </div>
                                </div>

                                {/* 罐装数量输入 */}
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                                        罐装数量
                                    </div>

                                    {/* 未罐装箱数 - 右侧显示计算结果 */}
                                    <Form.Item label='未罐装箱数'>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input
                                                type='number'
                                                value={selectedWine?.unpackagedBoxes || 0}
                                                disabled
                                                style={{
                                                    '--border-radius': '6px',
                                                    '--font-size': '16px',
                                                    '--color': '#999',
                                                    '--background': '#f5f5f5',
                                                    flex: 1
                                                }}
                                            />
                                            {getUnpackagedDisplay() && (
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#ff4d4f',
                                                    fontWeight: '500',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {getUnpackagedDisplay()}
                                                </div>
                                            )}
                                        </div>
                                    </Form.Item>

                                    {/* 新增已罐装 - 右侧显示计算结果 */}
                                    <Form.Item name='packagedBoxes' label='新增已罐装'>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input
                                                type='number'
                                                placeholder='请输入新增已罐装箱数'
                                                value={packagedValue}
                                                onChange={handlePackagedChange}
                                                style={{
                                                    '--border-radius': '6px',
                                                    '--font-size': '16px',
                                                    flex: 1
                                                }}
                                            />
                                            {getPackagedDisplay() && (
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#52c41a',
                                                    fontWeight: '500',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {getPackagedDisplay()}
                                                </div>
                                            )}
                                        </div>
                                        {/* 下方小字提示 */}
                                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                                            最多可新增 {selectedWine.unpackagedBoxes} 箱
                                        </div>
                                    </Form.Item>

                                    {/* 剩余水 - 右侧显示计算结果 */}
                                    <Form.Item name='remainingWater' label='剩余水'>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Input
                                                type='number'
                                                step='0.01'
                                                placeholder='请输入新的剩余水量'
                                                value={remainingWaterValue}
                                                onChange={handleRemainingWaterChange}
                                                style={{
                                                    '--border-radius': '6px',
                                                    '--font-size': '16px',
                                                    flex: 1
                                                }}
                                            />
                                            {getRemainingWaterDisplay() && (
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#fa8c16',
                                                    fontWeight: '500',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {getRemainingWaterDisplay()}
                                                </div>
                                            )}
                                        </div>
                                        {/* 下方小字提示 */}
                                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                                            直接输入新的数值
                                        </div>
                                    </Form.Item>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>

                {/* 提示信息 */}
                <Card style={{ marginTop: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
                            📝 操作说明
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            • <strong>左右滑动</strong>：酒水标签支持左右滑动查看更多选项
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            • <strong>持久保存</strong>：选择的酒水会自动保存，刷新页面后仍然保持选择
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            • <strong>新增已罐装</strong>：输入要从未罐装转为已罐装的箱数
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            • <strong>自动计算</strong>：新增已罐装的同时，未罐装会相应减少
                        </div>
                        <div>
                            • <strong>数量限制</strong>：新增已罐装数量不能超过未罐装箱数
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default EditWine;
