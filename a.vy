# @version ^0.3.10

stored_number: public(uint256)

event SetNumberExecuted:
    caller: indexed(address)


@nonreentrant
@external
def set_number(_num: uint256):
    self.stored_number = _num
    log SetNumberExecuted(msg.sender)

@external
@view
def get_number() -> uint256:
    return self.stored_number