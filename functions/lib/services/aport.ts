/**
 * APort Service for AppRoom
 *
 * Comprehensive APort integration for app passport management and policy verification.
 * Modeled after chimoney's APort service with AppRoom-specific adaptations.
 *
 * All tool calls and app operations go through the agent-passport policy verification endpoint.
 */

import type { AppEnv } from "../types";

interface APortResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status?: number;
    details?: any;
  };
}

interface PassportData {
  name: string;
  role: "agent";
  description: string;
  regions?: string[];
  contact?: string;
  assurance?: {
    type: "kyc" | "kyb";
    assurance_level: string;
    proof: any;
  };
  capabilities: Array<{
    id: string;
    params?: Record<string, any>;
  }>;
  limits?: Record<string, any>;
  status: "active" | "suspended" | "revoked";
  metadata?: Record<string, any>;
  pending_owner?: {
    email?: string;
    display_name?: string;
    github_username?: string;
  };
  send_claim_email?: boolean;
}

interface InstancePassportData {
  platform_id: string;
  tenant_ref: string;
  controller_id: string;
  controller_type: "user";
  overrides: {
    limits?: Record<string, any>;
    regions?: string[];
    status?: "active" | "suspended" | "revoked";
    contact?: string;
  };
  agent_data: {
    name: string;
    description: string;
  };
}

/**
 * Policy verification result from agent-passport
 */
interface PolicyDecision {
  decision_id: string;
  created_at: string;
  allow: boolean;
  reasons: Array<{
    code: string;
    message: string;
    severity: "info" | "warning" | "error";
  }>;
  expires_in: number;
  assurance_level?: string;
  passport_digest?: string;
  signature?: string;
  remaining_daily_cap?: Record<string, number>;
  owner_id?: string;
  policy_id?: string;
  agent_id: string;
}

/**
 * APort Service for AppRoom
 *
 * Main service for all APort interactions:
 * - Passport creation and management (builders and apps)
 * - Capability schema fetching
 * - Policy verification (all app tool calls go through this)
 */
export class APortService {
  private baseUrl: string;
  private agentPassportBaseUrl: string;
  private apiKey: string;
  private orgId: string;
  private providerId: string;

  constructor(env: AppEnv) {
    const APORT_BASE_URL =
      env.NEXT_PUBLIC_APORT_BASE_URL || "https://api.aport.io";
    const AGENT_PASSPORT_BASE_URL = "https://agent-passport-api.aport.io"; // or your deployment
    const APPROOM_PROVIDER_ID = "approom";

    this.baseUrl = env.APORT_BASE_URL || APORT_BASE_URL;
    this.agentPassportBaseUrl =
      env.AGENT_PASSPORT_BASE_URL || AGENT_PASSPORT_BASE_URL;
    this.apiKey = env.APORT_API_KEY;
    this.orgId = env.APORT_ORG_ID;
    this.providerId = APPROOM_PROVIDER_ID;

    if (!this.apiKey) {
      console.warn(
        "[APort] APORT_API_KEY not set. APort operations will fail.",
      );
    }
    if (!this.orgId) {
      console.warn(
        "[APort] APORT_ORG_ID not set. Organization issuance will fail.",
      );
    }
  }

  // ============================================================================
  // CAPABILITIES SCHEMA
  // ============================================================================

  /**
   * Fetch available capabilities and their limits schema from APort
   * This is used to show builders what capabilities are available when creating apps
   */
  async getCapabilitiesSchema(): Promise<APortResponse<any>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/schema/capabilities-limits`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to fetch capabilities schema",
            status: response.status,
            details: errorData,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[APort] Error fetching capabilities schema:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // ============================================================================
  // BUILDER PASSPORT MANAGEMENT
  // ============================================================================

  /**
   * Create APort passport for an app builder via organization issuance
   * Similar to chimoney's createUserPassport
   *
   * @param params Builder passport parameters
   * @returns Passport ID, DID, assurance level, and claim details
   */
  async createBuilderPassport(params: {
    builderId: string;
    email: string;
    displayName?: string;
    kycCompleted: boolean;
    verificationProof?: any;
    metadata?: Record<string, any>;
    regions?: string[];
    sendClaimEmail?: boolean;
    capabilities?: Array<{ id: string; params?: Record<string, any> }>;
    limits?: Record<string, any>;
    slug?: string;
  }): Promise<
    APortResponse<{
      passportId: string;
      did: string;
      assuranceLevel: string;
      claimed?: boolean;
      claim_link?: string;
      claim_token?: string;
      slug?: string;
    }>
  > {
    const {
      builderId,
      email,
      displayName,
      kycCompleted,
      verificationProof = {},
      metadata = {},
      regions = ["US", "CA", "EU"],
      sendClaimEmail = false,
      capabilities,
      limits,
      slug,
    } = params;

    if (!this.orgId) {
      return {
        success: false,
        error: {
          message: "APORT_ORG_ID is required for organization issuance",
        },
      };
    }

    // Determine assurance level based on KYC status (L4FIN would map to kyb; L0/L4KYC use kyc)
    const assuranceLevel = kycCompleted ? "L4KYC" : "L0";
    const assuranceType: "kyc" | "kyb" = "kyc";

    const passportData: PassportData = {
      name: displayName || email.split("@")[0],
      role: "agent",
      description:
        metadata?.description || `AI ${metadata?.role || "agent"} passport`,
      regions,
      contact: email,
      assurance: {
        type: assuranceType,
        assurance_level: assuranceLevel,
        proof: {
          verification_id:
            verificationProof.verification_id ||
            `ver_${builderId}_${Date.now()}`,
          verified_at:
            verificationProof.verified_at || new Date().toISOString(),
          ...verificationProof,
        },
      },
      capabilities: capabilities || [
        { id: "web.fetch" },
        { id: "data.file.read" },
        { id: "data.file.write" },
        { id: "mcp.tool.execute" },
      ],
      limits: limits || {},
      status: "active",
      ...(slug && { slug }),
      metadata: {
        provider: this.providerId,
        approom_builder_id: builderId,
        created_at: new Date().toISOString(),
        ...metadata,
      },
      // Add pending_owner for user claim flow (like Chimoney)
      // This goes in the REQUEST BODY, not as a top-level passport field
      pending_owner: {
        email,
        display_name: displayName || email.split("@")[0],
      },
      send_claim_email: sendClaimEmail,
    };

    try {
      // Call org issuance endpoint
      // pending_owner is in the body - APort will create unclaimed passport
      const response = await fetch(
        `${this.baseUrl}/api/orgs/${this.orgId}/issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(passportData),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        console.error("[APort] createBuilderPassport failed:", {
          status: response.status,
          url: `${this.baseUrl}/api/orgs/${this.orgId}/issue`,
          error: errorData,
        });
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to create builder passport",
            status: response.status,
            details: errorData,
          },
        };
      }

      const result = (await response.json()) as Record<string, unknown>;
      const responseData = (result.data ?? result) as Record<string, unknown>;
      const passport = (responseData.data ?? responseData) as Record<
        string,
        unknown
      >;

      const passportId = String(
        passport.agent_id ||
          responseData.agent_id ||
          passport.id ||
          passport.passport_id ||
          passport.instance_id ||
          "",
      );

      // Check if passport is claimed or not
      const claimed =
        passport.claimed !== false && responseData.claimed !== false;

      return {
        success: true,
        data: {
          passportId,
          did: String(passport.did || passport.DID || ""),
          assuranceLevel: String(passport.assurance_level || assuranceLevel),
          claimed,
          slug: String(responseData.slug || passport.slug || slug || ""),
          // Include claim details if passport is unclaimed (following Chimoney pattern)
          ...(responseData.claim_link != null
            ? { claim_link: String(responseData.claim_link) }
            : {}),
          ...(responseData.claim_token != null
            ? { claim_token: String(responseData.claim_token) }
            : {}),
        },
      };
    } catch (error) {
      console.error("[APort] Error creating builder passport:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // ============================================================================
  // APP PASSPORT MANAGEMENT
  // ============================================================================

  /**
   * Create instance passport for an app from builder's APort passport
   * Similar to chimoney's createAgentPassport
   * Instance automatically inherits assurance level from builder's passport
   *
   * @param params App passport parameters
   * @returns Passport ID, DID, and assurance level
   */
  async createAppPassport(params: {
    appId: string;
    builderPassportId: string;
    builderId: string;
    appName: string;
    appDescription: string;
    capabilities: string[];
    limits?: Record<string, any>;
    regions?: string[];
    metadata?: Record<string, any>;
  }): Promise<
    APortResponse<{ passportId: string; did: string; assuranceLevel: string }>
  > {
    const {
      appId,
      builderPassportId,
      builderId,
      appName,
      appDescription,
      capabilities,
      limits = {},
      regions = ["US", "CA", "EU"],
      metadata = {},
    } = params;

    if (!builderPassportId) {
      return {
        success: false,
        error: { message: "Builder passport ID is required" },
      };
    }

    const instanceData: InstancePassportData = {
      platform_id: this.providerId,
      tenant_ref: builderId,
      controller_id: builderId,
      controller_type: "user",
      overrides: {
        limits,
        regions,
        status: "active",
      },
      agent_data: {
        name: appName,
        description: appDescription,
      },
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/api/passports/${builderPassportId}/instances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(instanceData),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to create app passport",
            status: response.status,
            details: errorData,
          },
        };
      }

      const result = (await response.json()) as Record<string, unknown>;
      const passport =
        (result.data as Record<string, unknown>)?.data ??
        (result.data as Record<string, unknown>) ??
        {};

      const passportId = String(
        (passport as Record<string, unknown>).instance_id ||
          (passport as Record<string, unknown>).agent_id ||
          (passport as Record<string, unknown>).id ||
          (passport as Record<string, unknown>).passport_id ||
          "",
      );

      const p = passport as Record<string, unknown>;
      return {
        success: true,
        data: {
          passportId,
          did: String(p.did || ""),
          assuranceLevel: String(p.assurance_level || "inherited"),
        },
      };
    } catch (error) {
      console.error("[APort] Error creating app passport:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Get passport details from APort
   *
   * @param passportId Passport ID
   * @returns Passport data
   */
  async getPassport(
    passportId: string,
    format: "json" | "vc" | "vp" = "json",
  ): Promise<APortResponse<any>> {
    if (!passportId) {
      return {
        success: false,
        error: { message: "Passport ID is required" },
      };
    }

    try {
      const url = `${this.baseUrl}/api/passports/${passportId}?format=${format}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: { message: "Passport not found", status: 404 },
          };
        }

        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to get passport",
            status: response.status,
            details: errorData,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[APort] Error getting passport:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Get passport by slug from APort
   *
   * @param slug Passport slug (e.g. "aria")
   * @returns Passport data
   */
  async getPassportBySlug(
    slug: string,
    format: "json" | "vc" | "vp" = "json",
  ): Promise<APortResponse<any>> {
    if (!slug) {
      return {
        success: false,
        error: { message: "Slug is required" },
      };
    }

    try {
      const url = `${this.baseUrl}/api/passports/by-slug/${slug}?format=${format}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: { message: "Passport not found", status: 404 },
          };
        }

        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to get passport by slug",
            status: response.status,
            details: errorData,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[APort] Error getting passport by slug:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Resolve a passport by slug or agent ID
   * Tries slug first (shorter, friendlier), falls back to direct ID lookup
   */
  async resolvePassport(
    idOrSlug: string,
    format: "json" | "vc" | "vp" = "json",
  ): Promise<APortResponse<any>> {
    // If it looks like an agent_id (starts with ap_), fetch directly
    if (idOrSlug.startsWith("ap_")) {
      return this.getPassport(idOrSlug, format);
    }
    // Otherwise try by slug first, fall back to direct ID
    const bySlug = await this.getPassportBySlug(idOrSlug, format);
    if (bySlug.success) return bySlug;
    return this.getPassport(idOrSlug, format);
  }

  /**
   * Update passport capabilities and limits
   * Similar to chimoney's updatePassportPolicy
   *
   * @param params Update parameters
   * @returns Updated passport data
   */
  async updatePassportPolicy(params: {
    passportId: string;
    ownerPassportId?: string;
    capabilities?: string[];
    limits?: Record<string, any>;
    regions?: string[];
  }): Promise<APortResponse<any>> {
    const { passportId, ownerPassportId, capabilities, limits, regions } =
      params;

    if (!passportId) {
      return {
        success: false,
        error: { message: "Passport ID is required" },
      };
    }

    const updateData: any = {};

    if (capabilities) {
      updateData.capabilities = capabilities.map((cap) => ({
        id: cap,
        params: {},
      }));
    }

    if (limits) {
      updateData.limits = limits;
    }

    if (regions) {
      updateData.regions = regions;
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: {
          message:
            "At least one of capabilities, limits, or regions must be provided",
        },
      };
    }

    // Get owner_id for update
    let ownerId = ownerPassportId;
    if (!ownerId) {
      const passportResult = await this.getPassport(passportId);
      if (passportResult.success) {
        ownerId =
          passportResult.data?.owner_id ||
          passportResult.data?.subjectId ||
          this.orgId;
      } else {
        ownerId = this.orgId;
      }
    }

    if (ownerId) {
      updateData.owner_id = ownerId;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/passports/${passportId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to update passport",
            status: response.status,
            details: errorData,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[APort] Error updating passport:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Revoke an app passport
   * Similar to chimoney's revokePassport
   *
   * @param passportId Passport ID to revoke
   * @param ownerPassportId Owner passport ID (optional)
   * @returns Revocation result
   */
  async revokePassport(
    passportId: string,
    ownerPassportId?: string,
  ): Promise<APortResponse<any>> {
    if (!passportId) {
      return {
        success: false,
        error: { message: "Passport ID is required" },
      };
    }

    // Get owner_id
    let ownerId = ownerPassportId;
    if (!ownerId) {
      const passportResult = await this.getPassport(passportId);
      if (passportResult.success) {
        ownerId =
          passportResult.data?.owner_id ||
          passportResult.data?.subjectId ||
          this.orgId;
      } else {
        ownerId = this.orgId;
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/passports/${passportId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            status: "revoked",
            ...(ownerId && { owner_id: ownerId }),
          }),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Failed to revoke passport",
            status: response.status,
            details: errorData,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[APort] Error revoking passport:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // ============================================================================
  // POLICY VERIFICATION
  // All app tool calls go through agent-passport policy verification
  // ============================================================================

  /**
   * Verify policy before app operation
   * This is called for EVERY app tool invocation to ensure compliance
   *
   * Routes to: /api/verify/policy/[pack_id] on agent-passport
   *
   * @param params Verification parameters
   * @returns Policy decision
   */
  async verifyPolicy(params: {
    appPassportId: string;
    policyPackId: string;
    context: Record<string, any>;
    passport?: any; // Optional for local mode
  }): Promise<APortResponse<PolicyDecision>> {
    const { appPassportId, policyPackId, context, passport } = params;

    if (!appPassportId && !passport) {
      return {
        success: false,
        error: {
          message: "Either app passport ID or passport object is required",
        },
      };
    }

    try {
      const requestBody: any = {
        context: {
          agent_id: appPassportId,
          ...context,
        },
      };

      // Local mode: include passport in body
      if (passport) {
        requestBody.passport = passport;
      }

      const response = await fetch(
        `${this.agentPassportBaseUrl}/api/verify/policy/${policyPackId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as {
          message?: string;
        };
        return {
          success: false,
          error: {
            message: errorData.message || "Policy verification failed",
            status: response.status,
            details: errorData,
          },
        };
      }

      const result = (await response.json()) as Record<string, unknown>;
      const data = result.data as Record<string, unknown> | undefined;
      const decision = (result.decision ?? data?.decision ?? data) as
        | PolicyDecision
        | undefined;

      return { success: true, data: decision };
    } catch (error) {
      console.error("[APort] Error verifying policy:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Convenience method: Verify app tool execution
   *
   * @param params Tool execution parameters
   * @returns Policy decision
   */
  async verifyToolExecution(params: {
    appPassportId: string;
    toolName: string;
    toolParams: Record<string, any>;
    mcpServer?: string;
    mcpSession?: string;
  }): Promise<APortResponse<PolicyDecision>> {
    return this.verifyPolicy({
      appPassportId: params.appPassportId,
      policyPackId: "mcp.tool.execute.v1",
      context: {
        mcp_tool: params.toolName,
        ...(params.mcpServer && { mcp_server: params.mcpServer }),
        ...(params.mcpSession && { mcp_session: params.mcpSession }),
        tool_params: params.toolParams,
      },
    });
  }

  /**
   * Convenience method: Verify web fetch
   *
   * @param params Web fetch parameters
   * @returns Policy decision
   */
  async verifyWebFetch(params: {
    appPassportId: string;
    url: string;
    method?: string;
  }): Promise<APortResponse<PolicyDecision>> {
    return this.verifyPolicy({
      appPassportId: params.appPassportId,
      policyPackId: "web.fetch.v1",
      context: {
        url: params.url,
        method: params.method || "GET",
      },
    });
  }

  /**
   * Convenience method: Verify file access
   *
   * @param params File access parameters
   * @returns Policy decision
   */
  async verifyFileAccess(params: {
    appPassportId: string;
    operation: "read" | "write";
    filePath: string;
  }): Promise<APortResponse<PolicyDecision>> {
    const policyPackId =
      params.operation === "read" ? "data.file.read.v1" : "data.file.write.v1";

    return this.verifyPolicy({
      appPassportId: params.appPassportId,
      policyPackId,
      context: {
        file_path: params.filePath,
      },
    });
  }
}

/**
 * Create APort service instance from environment
 */
export function createAPortService(env: AppEnv): APortService {
  return new APortService(env);
}
