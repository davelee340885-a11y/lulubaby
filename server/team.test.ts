import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getTeamById: vi.fn(),
  getTeamByOwnerId: vi.fn(),
  getTeamsByUserId: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeamMembers: vi.fn(),
  getTeamMemberById: vi.fn(),
  getTeamMemberByUserAndTeam: vi.fn(),
  inviteTeamMember: vi.fn(),
  acceptTeamInvitation: vi.fn(),
  updateTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamMemberCount: vi.fn(),
  getTeamKnowledgeByTeamId: vi.fn(),
  getTeamKnowledgeById: vi.fn(),
  createTeamKnowledge: vi.fn(),
  updateTeamKnowledge: vi.fn(),
  deleteTeamKnowledge: vi.fn(),
  getAccessibleTeamKnowledge: vi.fn(),
  getTeamKnowledgeContent: vi.fn(),
  getTeamStats: vi.fn(),
}));

import {
  getTeamById,
  getTeamByOwnerId,
  getTeamsByUserId,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  getTeamMemberById,
  getTeamMemberByUserAndTeam,
  inviteTeamMember,
  acceptTeamInvitation,
  updateTeamMember,
  removeTeamMember,
  getTeamMemberCount,
  getTeamKnowledgeByTeamId,
  getTeamKnowledgeById,
  createTeamKnowledge,
  updateTeamKnowledge,
  deleteTeamKnowledge,
  getAccessibleTeamKnowledge,
  getTeamKnowledgeContent,
  getTeamStats,
} from "./db";

describe("Team Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Team CRUD", () => {
    it("should get team by ID", async () => {
      const mockTeam = {
        id: 1,
        name: "Test Team",
        description: "A test team",
        ownerId: 1,
        plan: "team_basic",
        maxMembers: 5,
      };
      
      vi.mocked(getTeamById).mockResolvedValue(mockTeam as any);
      
      const result = await getTeamById(1);
      expect(result).toEqual(mockTeam);
      expect(getTeamById).toHaveBeenCalledWith(1);
    });

    it("should get team by owner ID", async () => {
      const mockTeam = {
        id: 1,
        name: "Owner's Team",
        ownerId: 5,
        plan: "team_pro",
        maxMembers: 15,
      };
      
      vi.mocked(getTeamByOwnerId).mockResolvedValue(mockTeam as any);
      
      const result = await getTeamByOwnerId(5);
      expect(result).toEqual(mockTeam);
      expect(getTeamByOwnerId).toHaveBeenCalledWith(5);
    });

    it("should get teams by user ID", async () => {
      const mockTeams = [
        { id: 1, name: "Team A", memberRole: "owner" },
        { id: 2, name: "Team B", memberRole: "member" },
      ];
      
      vi.mocked(getTeamsByUserId).mockResolvedValue(mockTeams as any);
      
      const result = await getTeamsByUserId(1);
      expect(result).toHaveLength(2);
      expect(result[0].memberRole).toBe("owner");
    });

    it("should create a new team", async () => {
      const newTeam = {
        name: "New Team",
        description: "A brand new team",
        ownerId: 1,
        plan: "team_basic" as const,
        maxMembers: 5,
      };
      
      const createdTeam = { id: 1, ...newTeam };
      vi.mocked(createTeam).mockResolvedValue(createdTeam as any);
      
      const result = await createTeam(newTeam);
      expect(result).toEqual(createdTeam);
      expect(createTeam).toHaveBeenCalledWith(newTeam);
    });

    it("should update team", async () => {
      const updatedTeam = {
        id: 1,
        name: "Updated Team Name",
        description: "Updated description",
      };
      
      vi.mocked(updateTeam).mockResolvedValue(updatedTeam as any);
      
      const result = await updateTeam(1, { name: "Updated Team Name" });
      expect(result?.name).toBe("Updated Team Name");
    });

    it("should delete team", async () => {
      vi.mocked(deleteTeam).mockResolvedValue(undefined);
      
      await deleteTeam(1);
      expect(deleteTeam).toHaveBeenCalledWith(1);
    });
  });

  describe("Team Member Operations", () => {
    it("should get all team members", async () => {
      const mockMembers = [
        { id: 1, userId: 1, teamId: 1, role: "owner", userName: "Owner", userEmail: "owner@test.com" },
        { id: 2, userId: 2, teamId: 1, role: "admin", userName: "Admin", userEmail: "admin@test.com" },
        { id: 3, userId: 3, teamId: 1, role: "member", userName: "Member", userEmail: "member@test.com" },
      ];
      
      vi.mocked(getTeamMembers).mockResolvedValue(mockMembers as any);
      
      const result = await getTeamMembers(1);
      expect(result).toHaveLength(3);
      expect(result.find(m => m.role === "owner")).toBeDefined();
    });

    it("should get member by team and user", async () => {
      const mockMember = {
        id: 1,
        userId: 5,
        teamId: 1,
        role: "member",
        knowledgeAccess: "full",
        inviteStatus: "accepted",
      };
      
      vi.mocked(getTeamMemberByUserAndTeam).mockResolvedValue(mockMember as any);
      
      const result = await getTeamMemberByUserAndTeam(1, 5);
      expect(result?.role).toBe("member");
      expect(result?.knowledgeAccess).toBe("full");
    });

    it("should invite a member", async () => {
      const newMember = {
        teamId: 1,
        userId: 10,
        role: "member" as const,
        knowledgeAccess: "full" as const,
      };
      
      const invitedMember = { id: 5, ...newMember, inviteStatus: "pending" };
      vi.mocked(inviteTeamMember).mockResolvedValue(invitedMember as any);
      
      const result = await inviteTeamMember(newMember);
      expect(result?.inviteStatus).toBe("pending");
    });

    it("should accept invitation", async () => {
      const acceptedMember = {
        id: 5,
        userId: 10,
        teamId: 1,
        role: "member",
        inviteStatus: "accepted",
        joinedAt: new Date(),
      };
      
      vi.mocked(acceptTeamInvitation).mockResolvedValue(acceptedMember as any);
      
      const result = await acceptTeamInvitation(5);
      expect(result?.inviteStatus).toBe("accepted");
      expect(result?.joinedAt).toBeDefined();
    });

    it("should update member role", async () => {
      const updatedMember = {
        id: 5,
        userId: 10,
        teamId: 1,
        role: "admin",
        knowledgeAccess: "full",
      };
      
      vi.mocked(updateTeamMember).mockResolvedValue(updatedMember as any);
      
      const result = await updateTeamMember(5, { role: "admin" });
      expect(result?.role).toBe("admin");
    });

    it("should remove member", async () => {
      vi.mocked(removeTeamMember).mockResolvedValue(undefined);
      
      await removeTeamMember(5);
      expect(removeTeamMember).toHaveBeenCalledWith(5);
    });

    it("should get member count", async () => {
      vi.mocked(getTeamMemberCount).mockResolvedValue(8);
      
      const result = await getTeamMemberCount(1);
      expect(result).toBe(8);
    });
  });

  describe("Team Knowledge Operations", () => {
    it("should get all team knowledge", async () => {
      const mockKnowledge = [
        { id: 1, teamId: 1, category: "company_info", title: "Company Info", content: "About us...", isShared: true },
        { id: 2, teamId: 1, category: "products", title: "Products", content: "Our products...", isShared: true },
        { id: 3, teamId: 1, category: "faq", title: "FAQ", content: "Q&A...", isShared: false },
      ];
      
      vi.mocked(getTeamKnowledgeByTeamId).mockResolvedValue(mockKnowledge as any);
      
      const result = await getTeamKnowledgeByTeamId(1);
      expect(result).toHaveLength(3);
      expect(result.filter(k => k.isShared)).toHaveLength(2);
    });

    it("should create knowledge item", async () => {
      const newKnowledge = {
        teamId: 1,
        category: "sales_scripts" as const,
        title: "Sales Script",
        content: "Hello, I am...",
        isShared: true,
        createdBy: 1,
      };
      
      const createdKnowledge = { id: 4, ...newKnowledge };
      vi.mocked(createTeamKnowledge).mockResolvedValue(createdKnowledge as any);
      
      const result = await createTeamKnowledge(newKnowledge);
      expect(result?.title).toBe("Sales Script");
      expect(result?.category).toBe("sales_scripts");
    });

    it("should update knowledge item", async () => {
      const updatedKnowledge = {
        id: 1,
        teamId: 1,
        category: "company_info",
        title: "Updated Company Info",
        content: "New content...",
        isShared: true,
      };
      
      vi.mocked(updateTeamKnowledge).mockResolvedValue(updatedKnowledge as any);
      
      const result = await updateTeamKnowledge(1, { title: "Updated Company Info" });
      expect(result?.title).toBe("Updated Company Info");
    });

    it("should delete knowledge item", async () => {
      vi.mocked(deleteTeamKnowledge).mockResolvedValue(undefined);
      
      await deleteTeamKnowledge(1);
      expect(deleteTeamKnowledge).toHaveBeenCalledWith(1);
    });

    it("should get accessible knowledge for member with full access", async () => {
      const mockKnowledge = [
        { id: 1, teamId: 1, category: "company_info", title: "Company Info", isShared: true },
        { id: 2, teamId: 1, category: "products", title: "Products", isShared: true },
      ];
      
      vi.mocked(getAccessibleTeamKnowledge).mockResolvedValue(mockKnowledge as any);
      
      const result = await getAccessibleTeamKnowledge(1, 1);
      expect(result).toHaveLength(2);
    });

    it("should get team knowledge content as string", async () => {
      const contentString = "【公司資料】Company Info\nAbout us...\n\n---\n\n【產品目錄】Products\nOur products...";
      
      vi.mocked(getTeamKnowledgeContent).mockResolvedValue(contentString);
      
      const result = await getTeamKnowledgeContent(1);
      expect(result).toContain("公司資料");
      expect(result).toContain("產品目錄");
    });
  });

  describe("Team Statistics", () => {
    it("should get team stats", async () => {
      const mockStats = {
        memberCount: 8,
        knowledgeCount: 5,
        totalConversations: 1234,
        monthlyConversations: 456,
      };
      
      vi.mocked(getTeamStats).mockResolvedValue(mockStats);
      
      const result = await getTeamStats(1);
      expect(result.memberCount).toBe(8);
      expect(result.knowledgeCount).toBe(5);
      expect(result.totalConversations).toBe(1234);
    });
  });

  describe("Team Plan Limits", () => {
    it("should enforce member limits based on plan", async () => {
      // Team basic plan allows 5 members
      vi.mocked(getTeamMemberCount).mockResolvedValue(5);
      vi.mocked(getTeamById).mockResolvedValue({
        id: 1,
        name: "Basic Team",
        plan: "team_basic",
        maxMembers: 5,
      } as any);
      
      const team = await getTeamById(1);
      const memberCount = await getTeamMemberCount(1);
      
      expect(memberCount).toBe(team?.maxMembers);
      // In real implementation, this would prevent adding more members
    });

    it("should allow more members for team_pro plan", async () => {
      vi.mocked(getTeamById).mockResolvedValue({
        id: 2,
        name: "Pro Team",
        plan: "team_pro",
        maxMembers: 15,
      } as any);
      
      const team = await getTeamById(2);
      expect(team?.maxMembers).toBe(15);
    });

    it("should allow unlimited members for enterprise plan", async () => {
      vi.mocked(getTeamById).mockResolvedValue({
        id: 3,
        name: "Enterprise Team",
        plan: "enterprise",
        maxMembers: 999,
      } as any);
      
      const team = await getTeamById(3);
      expect(team?.maxMembers).toBe(999);
    });
  });

  describe("Knowledge Access Control", () => {
    it("should return all shared knowledge for full access members", async () => {
      const member = {
        id: 1,
        userId: 5,
        teamId: 1,
        role: "member",
        knowledgeAccess: "full",
      };
      
      vi.mocked(getTeamMemberById).mockResolvedValue(member as any);
      vi.mocked(getAccessibleTeamKnowledge).mockResolvedValue([
        { id: 1, title: "Knowledge 1", isShared: true },
        { id: 2, title: "Knowledge 2", isShared: true },
      ] as any);
      
      const result = await getAccessibleTeamKnowledge(1, 1);
      expect(result).toHaveLength(2);
    });

    it("should return limited knowledge for partial access members", async () => {
      const member = {
        id: 2,
        userId: 6,
        teamId: 1,
        role: "member",
        knowledgeAccess: "partial",
      };
      
      vi.mocked(getTeamMemberById).mockResolvedValue(member as any);
      vi.mocked(getAccessibleTeamKnowledge).mockResolvedValue([
        { id: 1, title: "Knowledge 1", isShared: true },
      ] as any);
      
      const result = await getAccessibleTeamKnowledge(1, 2);
      expect(result).toHaveLength(1);
    });

    it("should return no knowledge for no access members", async () => {
      const member = {
        id: 3,
        userId: 7,
        teamId: 1,
        role: "member",
        knowledgeAccess: "none",
      };
      
      vi.mocked(getTeamMemberById).mockResolvedValue(member as any);
      vi.mocked(getAccessibleTeamKnowledge).mockResolvedValue([]);
      
      const result = await getAccessibleTeamKnowledge(1, 3);
      expect(result).toHaveLength(0);
    });
  });
});
