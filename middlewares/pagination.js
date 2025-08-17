export const paginate = async (Model, query = {}, page = 1, limit = 12, populate = "") => {
    const skip = (page - 1) * limit;
    const total = await Model.countDocuments(query);
    const items = await Model.find(query)
      .populate(populate)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  
    const hasMore = skip + items.length < total;
  
    return {
      items,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore,
    };
  };
  