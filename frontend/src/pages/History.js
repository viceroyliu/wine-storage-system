import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    SearchBar,
    Tabs,
    Empty,
    PullToRefresh,
    DatePicker,
    Button,
    InfiniteScroll
} from 'antd-mobile';
import { CalendarOutline, CheckOutline, UndoOutline } from 'antd-mobile-icons';
import { historyAPI } from '../services/api';
import dayjs from 'dayjs';

const History = () => {
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [dateRange, setDateRange] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    // 分页相关状态
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        hasMore: true
    });

    // 头部容器的ref
    const headerRef = useRef(null);

    // 重置并加载历史记录
    const resetAndLoadHistories = useCallback(async () => {
        setHistories([]);
        setPagination({
            page: 1,
            limit: 10,
            total: 0,
            hasMore: true
        });
        await loadHistories(1, true);
    }, [activeTab, searchText, dateRange]);

    // 加载历史记录
    const loadHistories = useCallback(async (page = pagination.page, isReset = false) => {
        if (!isReset && (!pagination.hasMore || loading)) {
            return;
        }

        try {
            if (isReset) {
                setLoading(true);
            }

            const params = {
                page,
                limit: pagination.limit
            };

            if (activeTab !== 'all') {
                params.action = activeTab;
            }

            if (searchText && searchText.trim()) {
                params.search = searchText.trim();
            }

            if (dateRange) {
                params.startDate = dateRange;
                params.endDate = dateRange;
            }

            const response = await historyAPI.getHistories(params);
            const { histories: newHistories, pagination: paginationInfo } = response.data;

            if (isReset) {
                // 重置列表
                setHistories(newHistories);
            } else {
                // 追加数据
                setHistories(prev => [...prev, ...newHistories]);
            }

            setPagination({
                page: paginationInfo.page,
                limit: paginationInfo.limit,
                total: paginationInfo.total,
                hasMore: paginationInfo.page < paginationInfo.pages
            });

        } catch (error) {
            console.error('加载历史记录失败:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pagination.page, pagination.limit, pagination.hasMore, activeTab, searchText, dateRange, loading]);

    // 当筛选条件改变时，重置列表
    useEffect(() => {
        resetAndLoadHistories();
    }, [resetAndLoadHistories]);

    // 获取头部高度
    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.getBoundingClientRect().height;
                setHeaderHeight(height);
            }
        };

        // 初始计算
        updateHeaderHeight();

        // 监听窗口大小变化
        window.addEventListener('resize', updateHeaderHeight);

        // 延迟再次计算，确保DOM完全渲染
        const timer = setTimeout(updateHeaderHeight, 100);

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            clearTimeout(timer);
        };
    }, [searchText, dateRange, activeTab]);

    // 下拉刷新
    const handleRefresh = async () => {
        setRefreshing(true);
        await resetAndLoadHistories();
    };

    // 加载更多数据
    const loadMore = async () => {
        if (pagination.hasMore && !loading) {
            const nextPage = pagination.page + 1;
            setPagination(prev => ({ ...prev, page: nextPage }));
            await loadHistories(nextPage);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleDateClick = () => {
        if (dateRange) {
            // 如果已经选择了日期，点击则重置
            setDateRange(null);
        } else {
            // 如果没有选择日期，打开日期选择器
            setShowDatePicker(true);
        }
    };

    // 重置所有筛选条件
    const handleResetFilters = () => {
        setSearchText('');
        setDateRange(null);
        setActiveTab('all');
    };

    const formatNumber = (num) => {
        if (num === 0) return '0';
        return Number(num).toFixed(2).replace(/\.?0+$/, '');
    };

    const getActionInfo = (action) => {
        const actionMap = {
            'stock_in': { text: '入库', color: '#52c41a' },
            'stock_out': { text: '出库', color: '#ff4d4f' },
            'update_stock': { text: '更新', color: '#1890ff' }
        };
        return actionMap[action] || { text: '未知', color: '#666' };
    };

    const formatChangeValue = (value, label) => {
        if (value === 0) return null;

        const color = value > 0 ? '#52c41a' : '#ff4d4f';
        const prefix = value > 0 ? '+' : '';

        return (
            <span style={{ color, fontSize: '13px', fontWeight: '500', marginRight: '12px' }}>
                {label}: {prefix}{label === '剩余水' ? formatNumber(value) : value}
            </span>
        );
    };

    const tabs = [
        { key: 'all', title: '全部' },
        { key: 'stock_in', title: '入库' },
        { key: 'stock_out', title: '出库' },
        { key: 'update_stock', title: '更新' }
    ];

    const HistoryCard = ({ history }) => {
        const actionInfo = getActionInfo(history.action);
        const change = history.details?.change;
        // 计算操作后总库存
        const totalStock = (history.details?.after?.unpackagedBoxes || 0) + (history.details?.after?.packagedBoxes || 0);

        return (
            <div style={{
                margin: '0 16px 12px',
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #f0f0f0'
            }}>
                {/* 头部信息 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#333',
                        flex: 1
                    }}>
                        {history.wineName}
                    </div>
                    <div style={{
                        background: actionInfo.color,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {actionInfo.text}
                    </div>
                </div>

                {/* 变化信息 */}
                {change && (change.unpackagedBoxes !== 0 || change.packagedBoxes !== 0 || change.remainingWater !== 0) && (
                    <div style={{
                        marginBottom: '12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px'
                    }}>
                        {formatChangeValue(change.unpackagedBoxes, '未罐装')}
                        {formatChangeValue(change.packagedBoxes, '已罐装')}
                        {formatChangeValue(change.remainingWater, '剩余水')}
                    </div>
                )}

                {/* 操作后库存状态 */}
                {history.details?.after && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '12px',
                        marginBottom: '12px',
                        padding: '12px',
                        background: '#fafafa',
                        borderRadius: '8px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1890ff',
                                marginBottom: '2px'
                            }}>
                                {history.details.after.unpackagedBoxes}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                未罐装
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#52c41a',
                                marginBottom: '2px'
                            }}>
                                {history.details.after.packagedBoxes}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                已罐装
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#fa8c16',
                                marginBottom: '2px'
                            }}>
                                {formatNumber(history.details.after.remainingWater)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                剩余水
                            </div>
                        </div>
                    </div>
                )}

                {/* 底部信息 - 总库存放在最左边 */}
                <div style={{
                    fontSize: '11px',
                    color: '#999',
                    lineHeight: 1.2,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>总库存: {totalStock}箱</span>
                    <span>•</span>
                    <span>{history.operator}</span>
                    <span>•</span>
                    <span>{dayjs(history.createdAt).format('MM-DD HH:mm')}</span>
                    {history.remark && (
                        <>
                            <span>•</span>
                            <span style={{ color: '#666' }}>
                                {history.remark.length > 15 ? `${history.remark.substring(0, 15)}...` : history.remark}
                            </span>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // 检查是否有筛选条件
    const hasFilters = searchText || dateRange || activeTab !== 'all';

    // 内容区域顶部间距
    const contentTopPadding = 16;

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
            {/* 固定头部 */}
            <div
                ref={headerRef}
                style={{
                    background: 'white',
                    padding: '16px 16px 0 16px',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <h1 style={{ fontSize: '20px', fontWeight: '500', margin: 0 }}>
                        历史记录
                    </h1>
                    <Button
                        color='primary'
                        size='small'
                        fill={dateRange ? 'solid' : 'outline'}
                        onClick={handleDateClick}
                    >
                        {dateRange ? (
                            <>
                                <CheckOutline /> {dayjs(dateRange).format('MM-DD')}
                            </>
                        ) : (
                            <>
                                <CalendarOutline /> 日期
                            </>
                        )}
                    </Button>
                </div>

                {/* 搜索框 */}
                <SearchBar
                    placeholder='搜索酒水名称（支持模糊搜索）'
                    value={searchText}
                    onSearch={handleSearch}
                    onChange={setSearchText}
                    onClear={() => handleSearch('')}
                    style={{
                        '--border-radius': '20px',
                        '--background': '#f5f5f5',
                        paddingBottom: '0'
                    }}
                />

                {/* 标签页 - 去掉下边框 */}
                <div style={{ marginTop: '4px' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        style={{
                            '--content-padding': '0',
                            '--active-line-color': '#1890ff',
                            '--active-title-color': '#1890ff',
                            borderBottom: 'none'
                        }}
                    >
                        {tabs.map(tab => (
                            <Tabs.Tab title={tab.title} key={tab.key} />
                        ))}
                    </Tabs>
                </div>
            </div>

            {/* 历史记录列表 - 使用动态获取的头部高度 */}
            {headerHeight > 0 && (
                <div style={{
                    marginTop: `${headerHeight + contentTopPadding}px`,
                    minHeight: `calc(100vh - ${headerHeight + contentTopPadding}px)`
                }}>
                    <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
                        <div style={{
                            paddingBottom: '20px'
                        }}>
                            {loading && histories.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    加载中...
                                </div>
                            ) : histories.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '64px 16px'
                                }}>
                                    <Empty
                                        style={{ padding: '0' }}
                                        imageStyle={{ width: 100 }}
                                        description={
                                            hasFilters ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                                                        无匹配的历史记录
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
                                                        未找到符合条件的记录
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '14px' }}>暂无历史记录</div>
                                            )
                                        }
                                    />
                                    {hasFilters && (
                                        <Button
                                            color='primary'
                                            fill='outline'
                                            size='small'
                                            onClick={handleResetFilters}
                                            style={{ marginTop: '16px' }}
                                        >
                                            <UndoOutline /> 重置筛选条件
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {histories.map(history => (
                                        <HistoryCard key={history._id} history={history} />
                                    ))}

                                    {/* 无限滚动组件 */}
                                    <InfiniteScroll
                                        loadMore={loadMore}
                                        hasMore={pagination.hasMore}
                                        threshold={10}
                                    >
                                        {pagination.hasMore ? (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '12px 16px',
                                                fontSize: '12px',
                                                color: '#999'
                                            }}>
                                                正在加载更多...
                                            </div>
                                        ) : (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '8px 16px 4px 16px',
                                                fontSize: '12px',
                                                color: '#999'
                                            }}>
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.05)',
                                                    padding: '6px 12px',
                                                    borderRadius: '12px',
                                                    display: 'inline-block'
                                                }}>
                                                    共 {pagination.total} 条记录，已全部加载
                                                </div>
                                            </div>
                                        )}
                                    </InfiniteScroll>
                                </>
                            )}
                        </div>
                    </PullToRefresh>
                </div>
            )}

            {/* 日期选择器 */}
            <DatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                precision='day'
                onConfirm={(value) => {
                    setDateRange(value);
                    setShowDatePicker(false);
                }}
                title='选择日期'
            />
        </div>
    );
};

export default History;
