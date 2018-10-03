import enum
from sqlalchemy import ForeignKey, Column, Integer, String, DateTime, Boolean, func, Enum, Text, Index, Numeric
from sqlalchemy.dialects.mysql import BIGINT, INTEGER, NUMERIC
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class AddressStateEnum(enum.Enum):
    initializing = 1
    complete = 2


class Address(Base):
    __tablename__ = "addresses"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    address = Column(String(255), nullable=False)
    state = Column(Enum(AddressStateEnum), nullable=False, default=AddressStateEnum.initializing)
    date_updated = Column(INTEGER(unsigned=True), nullable=False)
    __table_args__ = (
        Index('address_idx', 'address', unique=True, mysql_length=42),
    )


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    address_id = Column(INTEGER(unsigned=True), ForeignKey('addresses.id'))
    address = relationship("Address", foreign_keys=[address_id])
    date_added = Column(INTEGER(unsigned=True), nullable=False)
    amount = Column(NUMERIC(36, 18, unsigned=False), nullable=False, index=True)
    tx = Column(String(255), nullable=False)
