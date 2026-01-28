package com.financetracker.service;

import com.financetracker.dto.invitation.InvitationRequest;
import com.financetracker.dto.invitation.InvitationResponse;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    private static final int INVITATION_EXPIRY_DAYS = 7;

    @Transactional
    public InvitationResponse sendInvitation(UUID userId, InvitationRequest request) {
        User inviter = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Family family = familyRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new ApiException("Không tìm thấy gia đình", HttpStatus.NOT_FOUND));

        // Check if inviter is OWNER or ADMIN
        FamilyMember inviterMember = familyMemberRepository.findByFamilyIdAndUserId(family.getId(), userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên của gia đình", HttpStatus.FORBIDDEN));

        if (inviterMember.getRole() != FamilyRole.OWNER && inviterMember.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể mời thành viên", HttpStatus.FORBIDDEN);
        }

        // Check if email exists in system - user must be registered
        User invitee = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng với email này. Người được mời phải đăng ký tài khoản trước.", HttpStatus.NOT_FOUND));

        // Cannot invite yourself
        if (invitee.getId().equals(userId)) {
            throw new ApiException("Bạn không thể mời chính mình", HttpStatus.BAD_REQUEST);
        }

        // Check if already a member
        if (familyMemberRepository.existsByFamilyIdAndUserId(family.getId(), invitee.getId())) {
            throw new ApiException("Người dùng đã là thành viên của nhóm", HttpStatus.BAD_REQUEST);
        }

        // Check if there's already a pending invitation
        if (invitationRepository.existsByFamilyIdAndInviteeEmailAndStatus(family.getId(), request.getEmail(), InvitationStatus.PENDING)) {
            throw new ApiException("Đã có lời mời đang chờ cho người dùng này", HttpStatus.BAD_REQUEST);
        }

        Invitation invitation = Invitation.builder()
                .family(family)
                .inviter(inviter)
                .inviteeEmail(request.getEmail())
                .invitee(invitee)
                .role(request.getRole() != null ? request.getRole() : FamilyRole.MEMBER)
                .status(InvitationStatus.PENDING)
                .token(UUID.randomUUID().toString())
                .message(request.getMessage())
                .expiresAt(OffsetDateTime.now().plusDays(INVITATION_EXPIRY_DAYS))
                .build();

        invitation = invitationRepository.save(invitation);
        return toInvitationResponse(invitation);
    }

    public List<InvitationResponse> getReceivedInvitations(UUID userId, String email) {
        List<Invitation> invitations = invitationRepository.findPendingByEmailOrUserId(email, userId);
        return invitations.stream()
                .filter(Invitation::isPending)
                .map(this::toInvitationResponse)
                .collect(Collectors.toList());
    }

    public long countPendingInvitations(UUID userId, String email) {
        return invitationRepository.countPendingByEmailOrUserId(email, userId);
    }

    public List<InvitationResponse> getFamilyInvitations(UUID userId, UUID familyId) {
        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (member.getRole() != FamilyRole.OWNER && member.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể xem lời mời", HttpStatus.FORBIDDEN);
        }

        List<Invitation> invitations = invitationRepository.findByFamilyId(familyId);
        return invitations.stream()
                .map(this::toInvitationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptInvitation(UUID userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Không tìm thấy lời mời", HttpStatus.NOT_FOUND));

        validateInvitationAccess(invitation, user);

        if (!invitation.isPending()) {
            throw new ApiException("Lời mời không còn hiệu lực", HttpStatus.BAD_REQUEST);
        }

        // Check if already a member
        if (familyMemberRepository.existsByFamilyIdAndUserId(invitation.getFamily().getId(), userId)) {
            throw new ApiException("Bạn đã là thành viên của gia đình này", HttpStatus.BAD_REQUEST);
        }

        // Add as family member
        FamilyMember newMember = FamilyMember.builder()
                .family(invitation.getFamily())
                .user(user)
                .role(invitation.getRole())
                .joinedAt(OffsetDateTime.now())
                .build();

        familyMemberRepository.save(newMember);

        // Update invitation status
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(OffsetDateTime.now());
        invitation.setInvitee(user);
        invitationRepository.save(invitation);
    }

    @Transactional
    public void declineInvitation(UUID userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Không tìm thấy lời mời", HttpStatus.NOT_FOUND));

        validateInvitationAccess(invitation, user);

        if (!invitation.isPending()) {
            throw new ApiException("Lời mời không còn hiệu lực", HttpStatus.BAD_REQUEST);
        }

        invitation.setStatus(InvitationStatus.DECLINED);
        invitation.setRespondedAt(OffsetDateTime.now());
        invitation.setInvitee(user);
        invitationRepository.save(invitation);
    }

    @Transactional
    public void cancelInvitation(UUID userId, UUID invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException("Không tìm thấy lời mời", HttpStatus.NOT_FOUND));

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(invitation.getFamily().getId(), userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (member.getRole() != FamilyRole.OWNER && member.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể hủy lời mời", HttpStatus.FORBIDDEN);
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new ApiException("Chỉ có thể hủy lời mời đang chờ", HttpStatus.BAD_REQUEST);
        }

        invitation.setStatus(InvitationStatus.CANCELLED);
        invitationRepository.save(invitation);
    }

    @Transactional
    public InvitationResponse resendInvitation(UUID userId, UUID invitationId) {
        Invitation oldInvitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException("Không tìm thấy lời mời", HttpStatus.NOT_FOUND));

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(oldInvitation.getFamily().getId(), userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (member.getRole() != FamilyRole.OWNER && member.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể gửi lại lời mời", HttpStatus.FORBIDDEN);
        }

        // Cancel old invitation
        oldInvitation.setStatus(InvitationStatus.CANCELLED);
        invitationRepository.save(oldInvitation);

        // Create new invitation
        Invitation newInvitation = Invitation.builder()
                .family(oldInvitation.getFamily())
                .inviter(member.getUser())
                .inviteeEmail(oldInvitation.getInviteeEmail())
                .invitee(oldInvitation.getInvitee())
                .role(oldInvitation.getRole())
                .status(InvitationStatus.PENDING)
                .token(UUID.randomUUID().toString())
                .message(oldInvitation.getMessage())
                .expiresAt(OffsetDateTime.now().plusDays(INVITATION_EXPIRY_DAYS))
                .build();

        newInvitation = invitationRepository.save(newInvitation);
        return toInvitationResponse(newInvitation);
    }

    private void validateInvitationAccess(Invitation invitation, User user) {
        boolean isInvitee = invitation.getInviteeEmail().equalsIgnoreCase(user.getEmail()) ||
                (invitation.getInvitee() != null && invitation.getInvitee().getId().equals(user.getId()));

        if (!isInvitee) {
            throw new ApiException("Bạn không phải người được mời", HttpStatus.FORBIDDEN);
        }
    }

    private InvitationResponse toInvitationResponse(Invitation invitation) {
        return InvitationResponse.builder()
                .id(invitation.getId())
                .familyId(invitation.getFamily().getId())
                .familyName(invitation.getFamily().getName())
                .inviterEmail(invitation.getInviter().getEmail())
                .inviterName(invitation.getInviter().getFullName())
                .inviteeEmail(invitation.getInviteeEmail())
                .role(invitation.getRole())
                .status(invitation.getStatus())
                .token(invitation.getToken())
                .message(invitation.getMessage())
                .expiresAt(invitation.getExpiresAt())
                .createdAt(invitation.getCreatedAt())
                .build();
    }
}
