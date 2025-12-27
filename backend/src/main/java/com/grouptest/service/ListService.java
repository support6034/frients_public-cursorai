package com.grouptest.service;

import com.grouptest.entity.ListEntity;
import com.grouptest.entity.ListMember;
import com.grouptest.repository.ListMemberRepository;
import com.grouptest.repository.ListRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ListService {
    
    @Autowired
    private ListRepository listRepository;
    
    @Autowired
    private ListMemberRepository listMemberRepository;
    
    public List<ListEntity> getAllLists() {
        return listRepository.findAll();
    }
    
    public Optional<ListEntity> getListById(Long id) {
        return listRepository.findById(id);
    }
    
    public Optional<ListEntity> getListByName(String name) {
        return listRepository.findByName(name);
    }
    
    public ListEntity createList(ListEntity list) {
        return listRepository.save(list);
    }
    
    public ListEntity updateList(Long id, ListEntity listData) {
        Optional<ListEntity> optionalList = listRepository.findById(id);
        if (optionalList.isPresent()) {
            ListEntity list = optionalList.get();
            list.setName(listData.getName());
            list.setDescription(listData.getDescription());
            list.setGoalCount(listData.getGoalCount());
            list.setGoalDescription(listData.getGoalDescription());
            return listRepository.save(list);
        }
        return null;
    }
    
    public boolean deleteList(Long id) {
        if (listRepository.existsById(id)) {
            listRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public List<ListMember> getListMembers(Long listId) {
        return listMemberRepository.findByListId(listId);
    }
    
    public ListMember addMember(Long listId, ListMember member) {
        member.setListId(listId);
        return listMemberRepository.save(member);
    }
    
    public Optional<ListMember> getListMemberByEmail(Long listId, String email) {
        return listMemberRepository.findByListIdAndLeadEmail(listId, email);
    }
    
    public ListMember updateMember(ListMember member) {
        return listMemberRepository.save(member);
    }
    
    public boolean removeMember(Long listId, String email) {
        Optional<ListMember> member = listMemberRepository.findByListIdAndLeadEmail(listId, email);
        if (member.isPresent()) {
            listMemberRepository.delete(member.get());
            return true;
        }
        return false;
    }
    
    public List<ListEntity> getListsByEmail(String email) {
        List<ListMember> members = listMemberRepository.findByLeadEmail(email);
        return members.stream()
            .map(member -> listRepository.findById(member.getListId()))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .toList();
    }
}

