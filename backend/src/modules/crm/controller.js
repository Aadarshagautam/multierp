import Lead from "./model.js";
import { logAudit } from "../../core/utils/auditLogger.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import { sharedCustomerService } from "../../shared/customers/service.js";

export const getLeads = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const { stage, priority, source } = req.query;

    const filter = { ...ownerFilter };
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (source) filter.source = source;

    const leads = await Lead.find(filter).sort({ stage: 1, stageOrder: 1, createdAt: -1 });
    return sendSuccess(res, { data: leads });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }
    return sendSuccess(res, { data: lead });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone, company, stage, expectedRevenue, probability, source, priority, tags, notes, nextFollowUp } = req.body;

    if (!name) {
      return sendError(res, { status: 400, message: "Lead name is required" });
    }

    // Get max stageOrder for the target stage
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const lastLead = await Lead.findOne({ ...ownerFilter, stage: stage || "new" }).sort({ stageOrder: -1 });
    const stageOrder = lastLead ? lastLead.stageOrder + 1 : 0;

    const lead = new Lead({
      name, email, phone, company,
      stage: stage || "new",
      stageOrder,
      expectedRevenue: expectedRevenue || 0,
      probability: probability || 10,
      source: source || "other",
      priority: priority || "medium",
      tags: tags || [],
      notes: notes || "",
      nextFollowUp: nextFollowUp || null,
      userId,
      orgId: req.orgId,
    });

    await lead.save();
    logAudit({ action: "create", module: "crm", targetId: lead._id, targetName: lead.name, description: `Created lead: ${lead.name}` }, req);
    return sendCreated(res, lead, "Lead created");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = pick(req.body, [
      "name",
      "email",
      "phone",
      "company",
      "stage",
      "expectedRevenue",
      "probability",
      "source",
      "priority",
      "tags",
      "notes",
      "nextFollowUp",
    ]);
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    if (Object.keys(updates).length === 0) {
      return sendError(res, { status: 400, message: "No valid fields to update" });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: id, ...ownerFilter },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    logAudit({ action: "update", module: "crm", targetId: lead._id, targetName: lead.name, description: `Updated lead: ${lead.name}` }, req);
    return sendSuccess(res, { data: lead, message: "Lead updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOneAndDelete({ _id: id, ...ownerFilter });
    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    logAudit({ action: "delete", module: "crm", targetId: lead._id, targetName: lead.name, description: `Deleted lead: ${lead.name}` }, req);
    return sendSuccess(res, { message: "Lead deleted" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const moveLeadStage = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { stage } = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const validStages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
    if (!validStages.includes(stage)) {
      return sendError(res, { status: 400, message: "Invalid stage" });
    }

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    // Get max order in target stage
    const lastInStage = await Lead.findOne({ ...ownerFilter, stage }).sort({ stageOrder: -1 });
    lead.stage = stage;
    lead.stageOrder = lastInStage ? lastInStage.stageOrder + 1 : 0;

    // Auto-update probability based on stage
    const stageProbabilities = { new: 10, contacted: 20, qualified: 40, proposal: 60, negotiation: 80, won: 100, lost: 0 };
    lead.probability = stageProbabilities[stage];

    await lead.save();
    logAudit({ action: "stage_change", module: "crm", targetId: lead._id, targetName: lead.name, description: `Moved lead "${lead.name}" to ${stage}` }, req);
    return sendSuccess(res, { data: lead, message: "Stage updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const convertToCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    if (lead.customerId) {
      return sendError(res, { status: 400, message: "Lead already converted to customer" });
    }

    // Create customer from lead
    const customer = await sharedCustomerService.create(
      {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        customerType: "regular",
      },
      req,
      {
        branchMode: "all",
        source: "crm",
      }
    );

    // Update lead
    lead.customerId = customer._id;
    lead.stage = "won";
    lead.probability = 100;
    await lead.save();

    logAudit({ action: "convert", module: "crm", targetId: lead._id, targetName: lead.name, description: `Converted lead "${lead.name}" to customer` }, req);
    return sendSuccess(res, { data: { lead, customer }, message: "Lead converted" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getLeadStats = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const leads = await Lead.find(ownerFilter);

    const stats = {
      total: leads.length,
      byStage: {},
      totalExpectedRevenue: 0,
      weightedRevenue: 0,
    };

    const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
    stages.forEach(s => { stats.byStage[s] = { count: 0, revenue: 0 }; });

    leads.forEach(lead => {
      stats.byStage[lead.stage].count++;
      stats.byStage[lead.stage].revenue += lead.expectedRevenue;
      stats.totalExpectedRevenue += lead.expectedRevenue;
      stats.weightedRevenue += lead.expectedRevenue * (lead.probability / 100);
    });

    return sendSuccess(res, { data: stats });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
