import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/Order';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

/**
 * Helper function to get date ranges for filtering
 */
function getDateRange(period: string): DateRange {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return {
        startDate,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        label: 'Today'
      };

    case 'week':
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      const weekEnd = new Date(startDate);
      weekEnd.setDate(startDate.getDate() + 7);
      return { startDate, endDate: weekEnd, label: 'This Week' };

    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate,
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        label: 'This Month'
      };

    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      return {
        startDate,
        endDate: new Date(now.getFullYear(), 11, 31),
        label: 'This Year'
      };

    case 'all':
    default:
      return {
        startDate: new Date(2020, 0, 1),
        endDate: new Date(),
        label: 'All Time'
      };
  }
}

/**
 * Calculate order KPIs for a given date range
 */
async function getOrdersKPIs(dateRange: DateRange) {
  const match = {
    createdAt: {
      $gte: dateRange.startDate,
      $lte: dateRange.endDate
    }
  };

  const totalOrders = await Order.countDocuments(match);
  
  const ordersCompleted = await Order.countDocuments({
    ...match,
    order_status: { $in: ['delivered', 'completed'] }
  });

  const ordersPending = await Order.countDocuments({
    ...match,
    order_status: { $in: ['pending', 'confirmed', 'shipped'] }
  });

  const ordersCancelled = await Order.countDocuments({
    ...match,
    order_status: 'cancelled'
  });

  // Revenue aggregation
  const revenueAgg = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: '$actual_amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const avgOrderValue = revenueAgg[0]?.count ? (totalRevenue / revenueAgg[0].count).toFixed(2) : 0;

  return {
    totalOrders,
    ordersCompleted,
    ordersPending,
    ordersCancelled,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    avgOrderValue: parseFloat(avgOrderValue as string),
  };
}

/**
 * Get inventory KPIs
 */
async function getInventoryKPIs(lowStockThreshold: number = 10) {
  const totalMedicines = await Medicine.countDocuments({ isDeleted: false });

  const lowStockMedicines = await Medicine.countDocuments({
    stock: { $gt: 0, $lte: lowStockThreshold },
    isDeleted: false
  });

  const outOfStockMedicines = await Medicine.countDocuments({
    stock: 0,
    isDeleted: false
  });

  const now = new Date();
  const expiredMedicines = await Medicine.countDocuments({
    expiryDate: { $lt: now },
    isDeleted: false
  });

  // Low stock medicines list
  const lowStockList = await Medicine.find({
    stock: { $gt: 0, $lte: lowStockThreshold },
    isDeleted: false
  })
    .select('name stock expiryDate')
    .limit(10);

  // Expired medicines list
  const expiredList = await Medicine.find({
    expiryDate: { $lt: now },
    isDeleted: false
  })
    .select('name expiryDate stock')
    .limit(10);

  return {
    totalMedicines,
    lowStockMedicines,
    outOfStockMedicines,
    expiredMedicines,
    lowStockList,
    expiredList,
  };
}

/**
 * Get orders trend data for graph
 */
async function getOrdersTrendData(period: string) {
  let groupBy: any;
  const now = new Date();
  const dateRange = getDateRange(period);

  if (period === 'today') {
    // Hourly breakdown
    groupBy = {
      $dateToString: {
        format: '%Y-%m-%d %H:00',
        date: '$createdAt'
      }
    };
  } else if (period === 'week') {
    // Daily breakdown
    groupBy = {
      $dateToString: {
        format: '%Y-%m-%d',
        date: '$createdAt'
      }
    };
  } else {
    // Weekly breakdown
    groupBy = {
      $dateToString: {
        format: '%Y-W%V',
        date: '$createdAt'
      }
    };
  }

  const trendData = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      }
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        revenue: { $sum: '$actual_amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    dates: trendData.map(d => d._id),
    orders: trendData.map(d => d.count),
    revenue: trendData.map(d => parseFloat(d.revenue.toFixed(2)))
  };
}

/**
 * Get order status distribution
 */
async function getOrderStatusDistribution(dateRange: DateRange) {
  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  
  const distribution = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await Order.countDocuments({
        order_status: status,
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      })
    }))
  );

  return distribution.filter(d => d.count > 0);
}

/**
 * Get revenue trend data
 */
async function getRevenueTrendData(period: string) {
  let groupBy: any;
  const dateRange = getDateRange(period);

  if (period === 'today') {
    groupBy = {
      $dateToString: {
        format: '%Y-%m-%d %H:00',
        date: '$createdAt'
      }
    };
  } else if (period === 'week') {
    groupBy = {
      $dateToString: {
        format: '%Y-%m-%d',
        date: '$createdAt'
      }
    };
  } else {
    groupBy = {
      $dateToString: {
        format: '%Y-%m',
        date: '$createdAt'
      }
    };
  }

  const trendData = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      }
    },
    {
      $group: {
        _id: groupBy,
        totalRevenue: { $sum: '$actual_amount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    dates: trendData.map(d => d._id),
    revenue: trendData.map(d => parseFloat(d.totalRevenue.toFixed(2))),
    orders: trendData.map(d => d.orderCount)
  };
}

/**
 * Main API handler
 */
export async function GET(req: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const section = searchParams.get('section') || 'all'; // all, orders, inventory, revenue
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Use custom date range if provided
    const dateRange = customStartDate && customEndDate
      ? {
          startDate: new Date(customStartDate),
          endDate: new Date(customEndDate),
          label: 'Custom Range'
        }
      : getDateRange(period);

    const lowStockThreshold = 10; // Can be made configurable from settings

    let response: any = {};

    if (section === 'all' || section === 'orders') {
      const ordersKPIs = await getOrdersKPIs(dateRange);
      const ordersTrend = await getOrdersTrendData(period);
      const orderStatus = await getOrderStatusDistribution(dateRange);

      response.orders = {
        kpis: [
          { label: 'Total Orders', value: ordersKPIs.totalOrders, icon: 'package' },
          { label: 'Completed', value: ordersKPIs.ordersCompleted, icon: 'check-circle', color: 'green' },
          { label: 'Pending', value: ordersKPIs.ordersPending, icon: 'clock', color: 'yellow' },
          { label: 'Cancelled', value: ordersKPIs.ordersCancelled, icon: 'x-circle', color: 'red' }
        ],
        trend: ordersTrend,
        statusDistribution: orderStatus,
        period: dateRange.label
      };
    }

    if (section === 'all' || section === 'inventory') {
      const inventoryKPIs = await getInventoryKPIs(lowStockThreshold);

      response.inventory = {
        kpis: [
          { label: 'Total Medicines', value: inventoryKPIs.totalMedicines, icon: 'pill' },
          { label: 'Low Stock', value: inventoryKPIs.lowStockMedicines, icon: 'alert-triangle', color: 'orange', threshold: lowStockThreshold },
          { label: 'Out of Stock', value: inventoryKPIs.outOfStockMedicines, icon: 'x-circle', color: 'red' },
          { label: 'Expired', value: inventoryKPIs.expiredMedicines, icon: 'alert-circle', color: 'red' }
        ],
        lowStockList: inventoryKPIs.lowStockList,
        expiredList: inventoryKPIs.expiredList
      };
    }

    if (section === 'all' || section === 'revenue') {
      const revenueTrend = await getRevenueTrendData(period);
      const ordersKPIs = await getOrdersKPIs(dateRange);

      // Compare with previous period
      let previousDateRange = getDateRange(period);
      const timeDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      previousDateRange.startDate = new Date(dateRange.startDate.getTime() - timeDiff);
      previousDateRange.endDate = new Date(dateRange.startDate);

      const previousKPIs = await getOrdersKPIs(previousDateRange);
      const revenueGrowth = previousKPIs.totalRevenue
        ? (((ordersKPIs.totalRevenue - previousKPIs.totalRevenue) / previousKPIs.totalRevenue) * 100).toFixed(2)
        : 0;

      response.revenue = {
        kpis: [
          { label: 'Total Revenue (Daily)', value: ordersKPIs.totalRevenue, icon: 'dollar-sign', format: 'currency' },
          { label: 'Total Revenue (Monthly)', value: ordersKPIs.totalRevenue * 30, icon: 'trending-up', format: 'currency' },
          { label: 'Total Revenue (Yearly)', value: ordersKPIs.totalRevenue * 365, icon: 'line-chart', format: 'currency' }
        ],
        trend: revenueTrend,
        growth: revenueGrowth,
        previousPeriodRevenue: previousKPIs.totalRevenue,
        period: dateRange.label
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
        dateRange: {
          start: dateRange.startDate,
          end: dateRange.endDate,
          label: dateRange.label
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
